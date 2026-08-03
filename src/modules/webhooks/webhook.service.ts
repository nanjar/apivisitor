import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface NewChatMessageWebhookPayload {
  eventsId: number;
  chatId: number;
  companyId: number | null;
  recipientMemberId: number;
  senderGuestsId: number;
  senderName: string;
  message: string;
  sentAt: string;
}

/**
 * Webhook OUTBOUND ke backend Exhibitor app — solusi transisi buat gap
 * "PIC gak dapat push notification" (device token PIC dikelola di sistem
 * Exhibitor yang backend-nya terpisah dari visitor-api ini).
 *
 * Alur: visitor kirim pesan -> backend ini POST ke endpoint Exhibitor ->
 * Exhibitor yang trigger notifikasi ke PIC pakai sistem mereka sendiri
 * (Firebase/apapun). Backend ini TIDAK perlu tau gimana caranya, cuma
 * ngasih tau "ada pesan baru buat member X".
 *
 * Desain sengaja SIMPEL buat masa transisi: 1x percobaan, timeout pendek,
 * fire-and-forget (gagal kirim webhook TIDAK gagalin pengiriman chat).
 * BELUM ada retry queue/persistence — kalau butuh keandalan lebih (retry
 * otomatis, dead-letter queue), itu perlu infra tambahan (mis. BullMQ)
 * yang di luar scope "solusi transisi" ini.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookUrl?: string;
  private readonly webhookSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('EXHIBITOR_CHAT_WEBHOOK_URL');
    this.webhookSecret = this.configService.get<string>('EXHIBITOR_CHAT_WEBHOOK_SECRET');
  }

  get isEnabled(): boolean {
    return !!this.webhookUrl;
  }

  async notifyNewChatMessage(payload: NewChatMessageWebhookPayload): Promise<void> {
    if (!this.webhookUrl) return; // fitur nonaktif, diam-diam skip

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (this.webhookSecret) {
      const signature = crypto.createHmac('sha256', this.webhookSecret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(
          `Webhook new-chat-message ke Exhibitor gagal (HTTP ${response.status}), chatId=${payload.chatId}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Webhook new-chat-message ke Exhibitor error (chatId=${payload.chatId}): ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
