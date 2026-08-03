import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { FacilitiesService } from './facilities.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Facilities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  list(@CurrentUser() user: CurrentVisitor) {
    return this.facilitiesService.list(user.eventsId);
  }
}
