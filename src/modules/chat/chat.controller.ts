import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './chat.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Screen: Chat List
  @Get('rooms')
  listRooms(@CurrentUser() user: CurrentVisitor) {
    return this.chatService.listRooms(user.eventsId, user.guestsId);
  }

  // Screen: Chat Room - history
  @Get(':chatId/messages')
  getMessages(@CurrentUser() user: CurrentVisitor, @Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatService.getMessages(user.eventsId, user.guestsId, chatId);
  }

  // Fallback kirim pesan lewat REST (utamanya pakai WebSocket gateway,
  // lihat chat.gateway.ts, tapi endpoint ini tetap disediakan untuk client
  // yang belum connect socket / untuk testing).
  @Post(':chatId/messages')
  sendMessage(
    @CurrentUser() user: CurrentVisitor,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.eventsId, user.guestsId, chatId, user.fullname, dto.message);
  }
}
