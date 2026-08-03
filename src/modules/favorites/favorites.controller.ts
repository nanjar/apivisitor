import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoritesService } from './favorites.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: CurrentVisitor) {
    return this.favoritesService.list(user.eventsId, user.guestsId);
  }

  @Post('toggle')
  toggle(@CurrentUser() user: CurrentVisitor, @Body() dto: ToggleFavoriteDto) {
    return this.favoritesService.toggle(user.eventsId, user.guestsId, dto);
  }
}
