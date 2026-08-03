import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { ExploreQueryDto } from './dto/explore-query.dto';
import { ExploreService } from './explore.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Explore')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  search(@CurrentUser() user: CurrentVisitor, @Query() query: ExploreQueryDto) {
    return this.exploreService.search(user.eventsId, query);
  }

  // Screen: Explore -> "Recently Viewed" section
  @Get('recently-viewed')
  getRecentlyViewed(@CurrentUser() user: CurrentVisitor) {
    return this.exploreService.getRecentlyViewed(user.eventsId, user.guestsId);
  }
}
