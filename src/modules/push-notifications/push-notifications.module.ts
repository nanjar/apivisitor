import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorDeviceToken } from '../notifications/entities/visitor-device-token.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([VisitorDeviceToken])],
  controllers: [PushNotificationsController],
  providers: [FirebaseAdminService, PushNotificationsService],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}
