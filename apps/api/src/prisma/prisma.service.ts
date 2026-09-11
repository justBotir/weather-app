import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL.');
    } catch (error) {
      // Favourites are the only feature that needs the database. Weather must
      // keep working without it, so we log and continue rather than killing boot.
      this.logger.error(
        `Could not connect to PostgreSQL: ${(error as Error).message}. ` +
          'Favourites will be unavailable; check DATABASE_URL.',
      );
    }
  }

  /**
   * Without this, `nest start --watch` leaks a connection on every reload and
   * eventually exhausts Postgres's connection slots mid-session.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
