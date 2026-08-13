import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceTokenDto } from '../push-notifications/dto/register-device-token.dto';
import { HomeService } from './home.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Home')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: CurrentVisitor) {
    return this.homeService.getDashboard(user.eventsId, user.guestsId);
  }

  // Dipanggil Flutter app pas dashboard dibuka — register/update FCM
  // device token punya visitor ini. Disimpan di visitor_device_token
  // (BUKAN guests_ticket — tabel itu ke-overwrite tiap sync MySQL jalan).
  @Patch('device-id')
  updateDeviceId(@CurrentUser() user: CurrentVisitor, @Body() dto: RegisterDeviceTokenDto) {
    return this.homeService.updateDeviceId(user.eventsId, user.guestsId, dto);
  }
}
