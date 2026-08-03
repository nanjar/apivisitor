import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Recommendations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('recommendations/exhibitors')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // Screen: AI Exhibitor Recommendation
  @Get()
  getRecommendations(@CurrentUser() user: CurrentVisitor) {
    return this.recommendationsService.getRecommendations(user.eventsId, user.guestsId);
  }
}
