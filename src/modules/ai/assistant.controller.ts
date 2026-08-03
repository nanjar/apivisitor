import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { AssistantChatDto } from './dto/assistant-chat.dto';
import { AssistantService } from './assistant.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('AI Assistant')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ai/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  // Screen: AI Assistant
  @Post('chat')
  chat(@CurrentUser() user: CurrentVisitor, @Body() dto: AssistantChatDto) {
    return this.assistantService.chat(user.eventsId, dto);
  }
}
