import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { PushNotificationsService } from './push-notifications.service';

@ApiTags('Push Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('push-notifications')
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  // Dipanggil Flutter app pas dapet FCM token (login, token refresh, dst)
  @Post('device-token')
  register(@CurrentUser() user: CurrentVisitor, @Body() dto: RegisterDeviceTokenDto) {
    return this.pushNotificationsService.registerDeviceToken(user.eventsId, user.guestsId, dto);
  }

  // Dipanggil pas logout / app mau berhenti terima notif dari device ini
  @Delete('device-token/:token')
  unregister(@Param('token') token: string) {
    return this.pushNotificationsService.unregisterDeviceToken(token);
  }
}
