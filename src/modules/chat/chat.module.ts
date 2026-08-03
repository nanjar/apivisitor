import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventChat } from './entities/event-chat.entity';
import { EventChatMember } from './entities/event-chat-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateway/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventChat, EventChatMember, ChatMessage, ExhibitorCompany]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    PushNotificationsModule,
    WebhooksModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
