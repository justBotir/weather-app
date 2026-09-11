import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { FavoriteLocation } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { toLocationKey } from '../weather/weather.utils';
import type { CreateFavoriteDto } from './dto/create-favorite.dto';

/** What the client receives. Decimals become plain numbers; internals stay internal. */
export interface FavoriteDto {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  locationKey: string;
  label?: string;
  sortOrder: number;
}

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<FavoriteDto[]> {
    const rows = await this.prisma.favoriteLocation.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.toDto(row));
  }

  /**
   * Idempotent by design: starring a city twice is a no-op, not a duplicate row
   * and not an error. The unique constraint on (userId, locationKey) is what
   * makes this safe under concurrent clicks.
   */
  async add(userId: string, dto: CreateFavoriteDto): Promise<FavoriteDto> {
    await this.ensureUser(userId);

    const locationKey = toLocationKey(dto.lat, dto.lon);
    const count = await this.prisma.favoriteLocation.count({ where: { userId } });

    const row = await this.prisma.favoriteLocation.upsert({
      where: { userId_locationKey: { userId, locationKey } },
      // Re-starring refreshes the label and the display name, nothing else —
      // sortOrder and createdAt must survive, or the list reshuffles itself.
      update: { name: dto.name, state: dto.state ?? null, label: dto.label ?? null },
      create: {
        userId,
        locationKey,
        name: dto.name,
        country: dto.country.toUpperCase(),
        state: dto.state ?? null,
        lat: dto.lat,
        lon: dto.lon,
        label: dto.label ?? null,
        sortOrder: count,
      },
    });

    return this.toDto(row);
  }

  /**
   * Scoped delete: `userId` is part of the WHERE clause, so one user can never
   * delete another's row by guessing an id. Never look up by id alone.
   */
  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.favoriteLocation.deleteMany({ where: { id, userId } });
    if (count === 0) {
      throw new NotFoundException('Favourite not found.');
    }
  }

  /** Creates the row for a cookie-only visitor the first time they save anything. */
  private async ensureUser(userId: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, isAnonymous: true },
    });
  }

  private toDto(row: FavoriteLocation): FavoriteDto {
    return {
      id: row.id,
      name: row.name,
      country: row.country,
      state: row.state ?? undefined,
      // Decimal -> number at the boundary: the client should never receive
      // Prisma's Decimal object, which JSON.stringify turns into a string.
      lat: row.lat.toNumber(),
      lon: row.lon.toNumber(),
      locationKey: row.locationKey,
      label: row.label ?? undefined,
      sortOrder: row.sortOrder,
    };
  }
}
