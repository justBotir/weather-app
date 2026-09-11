import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';

import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService, type FavoriteDto } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<FavoriteDto[]> {
    return this.favorites.list(userId);
  }

  @Post()
  add(@CurrentUserId() userId: string, @Body() dto: CreateFavoriteDto): Promise<FavoriteDto> {
    return this.favorites.add(userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string): Promise<void> {
    return this.favorites.remove(userId, id);
  }
}
