import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { VenueService } from './venue.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Venue')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('venue')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Get('floor-map')
  getFloorMap(@CurrentUser() user: CurrentVisitor) {
    return this.venueService.getFloorMap(user.eventsId);
  }
}
