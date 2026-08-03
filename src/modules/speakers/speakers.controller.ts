import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { SpeakersService } from './speakers.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Speakers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Get()
  list(@CurrentUser() user: CurrentVisitor) {
    return this.speakersService.list(user.eventsId);
  }

  // Screen: Speaker Detail
  @Get(':id')
  getDetail(@CurrentUser() user: CurrentVisitor, @Param('id', ParseIntPipe) id: number) {
    return this.speakersService.getDetail(user.eventsId, id);
  }
}
