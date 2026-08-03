import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../auth/auth.service';
import { ChatService } from '../chat.service';

interface AuthedSocket extends Socket {
  data: { user?: JwtPayload };
}

// Kalau client kirim "mulai ngetik" tapi gak pernah kirim "berhenti ngetik"
// (mis. app di-kill paksa / koneksi putus mendadak tanpa graceful disconnect),
// indikator "sedang mengetik..." di sisi lawan chat bisa nyangkut selamanya.
// Auto-clear server-side setelah durasi ini kalau gak ada refresh event baru.
const TYPING_AUTO_CLEAR_MS = 5000;

/**
 * Client connect dengan query/auth: { token: '<accessToken>' }
 * Event yang didukung:
 *  - 'chat:join'    { chatId }
 *  - 'chat:send'    { chatId, message }
 *  - 'chat:message' (server -> client, broadcast pesan baru ke room)
 *  - 'chat:typing'  { chatId, isTyping: boolean } (client -> server)
 *  - 'chat:typing'  { chatId, guestsId, fullname, isTyping } (server -> client lain di room, BUKAN ke pengirim)
 */
@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // key: `${socketId}:${chatId}` -> timer auto-clear
  private readonly typingTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      client.data.user = payload;
    } catch {
      this.logger.warn(`Socket ${client.id} gagal autentikasi, disconnect`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.debug(`Socket ${client.id} disconnected`);
    // Bersihin semua timer typing punya socket ini biar gak ada leak & biar
    // lawan chat gak nyangkut liat "sedang mengetik" padahal orangnya udah disconnect.
    for (const key of this.typingTimers.keys()) {
      if (key.startsWith(`${client.id}:`)) {
        clearTimeout(this.typingTimers.get(key));
        this.typingTimers.delete(key);
      }
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { chatId: number }) {
    await client.join(this.roomKey(client.data.user!.eventsId, body.chatId));
  }

  @SubscribeMessage('chat:send')
  async handleSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { chatId: number; message: string },
  ) {
    const user = client.data.user!;

    // Begitu pesan terkirim, anggap "berhenti mengetik" — hindari indikator
    // typing yang masih nyala padahal pesannya udah nyampe.
    this.clearTyping(client, user.eventsId, body.chatId);

    const saved = await this.chatService.sendMessage(
      user.eventsId,
      user.sub,
      body.chatId,
      user.fullname,
      body.message,
    );
    this.server.to(this.roomKey(user.eventsId, body.chatId)).emit('chat:message', saved);
    return saved;
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { chatId: number; isTyping: boolean },
  ) {
    const user = client.data.user!;
    const timerKey = `${client.id}:${body.chatId}`;

    // clearTyping/broadcast pakai client.to(...) (bukan server.to) supaya
    // pengirim gak dapet balik event typing-nya sendiri.
    client.to(this.roomKey(user.eventsId, body.chatId)).emit('chat:typing', {
      chatId: body.chatId,
      guestsId: user.sub,
      fullname: user.fullname,
      isTyping: body.isTyping,
    });

    const existingTimer = this.typingTimers.get(timerKey);
    if (existingTimer) clearTimeout(existingTimer);

    if (body.isTyping) {
      const timer = setTimeout(() => {
        client.to(this.roomKey(user.eventsId, body.chatId)).emit('chat:typing', {
          chatId: body.chatId,
          guestsId: user.sub,
          fullname: user.fullname,
          isTyping: false,
        });
        this.typingTimers.delete(timerKey);
      }, TYPING_AUTO_CLEAR_MS);
      this.typingTimers.set(timerKey, timer);
    } else {
      this.typingTimers.delete(timerKey);
    }
  }

  private clearTyping(client: AuthedSocket, eventsId: number, chatId: number) {
    const timerKey = `${client.id}:${chatId}`;
    const timer = this.typingTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(timerKey);
      client.to(this.roomKey(eventsId, chatId)).emit('chat:typing', {
        chatId,
        guestsId: client.data.user!.sub,
        fullname: client.data.user!.fullname,
        isTyping: false,
      });
    }
  }

  private roomKey(eventsId: number, chatId: number) {
    return `event:${eventsId}:chat:${chatId}`;
  }
}
