import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class AssistantChatDto {
  // Riwayat percakapan dikelola di sisi client (stateless server) — client
  // kirim history lengkap tiap request. Dibatasi 20 pesan terakhir supaya
  // prompt gak membengkak buat model 8B lokal.
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
