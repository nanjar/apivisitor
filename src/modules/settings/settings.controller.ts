import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: CurrentVisitor) {
    return this.settingsService.getSettings(user.eventsId, user.guestsId);
  }

  @Patch()
  updateSettings(@CurrentUser() user: CurrentVisitor, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(user.eventsId, user.guestsId, dto);
  }
}
