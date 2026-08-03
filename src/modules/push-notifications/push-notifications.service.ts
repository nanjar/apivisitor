import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VisitorDeviceToken } from '../notifications/entities/visitor-device-token.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    @InjectRepository(VisitorDeviceToken)
    private readonly deviceTokenRepo: Repository<VisitorDeviceToken>,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  // Dipanggil Flutter app pas dapet FCM token baru (login, token refresh, dst)
  async registerDeviceToken(eventsId: number, guestsId: number, dto: RegisterDeviceTokenDto) {
    const existing = await this.deviceTokenRepo.findOne({
      where: { deviceToken: dto.deviceToken },
    });

    if (existing) {
      // Token yang sama mungkin sebelumnya kepasang ke guest lain di
      // device yang sama (device dipakai gantian/re-login) — update ke
      // guest yang sekarang login.
      existing.eventsId = eventsId;
      existing.guestsId = guestsId;
      existing.platform = dto.platform;
      existing.updatedAt = new Date();
      await this.deviceTokenRepo.save(existing);
      return { registered: true };
    }

    await this.deviceTokenRepo.save(
      this.deviceTokenRepo.create({
        eventsId,
        guestsId,
        deviceToken: dto.deviceToken,
        platform: dto.platform,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    return { registered: true };
  }

  async unregisterDeviceToken(deviceToken: string) {
    await this.deviceTokenRepo.delete({ deviceToken });
    return { unregistered: true };
  }

  /**
   * Kirim push notification ke SEMUA device milik 1 guest. Fire-and-forget
   * dari sisi caller (ChatService) — kalau gagal (FCM belum dikonfigurasi,
   * network error, dst), cukup log warning, JANGAN sampai gagalin proses
   * kirim chat message itu sendiri.
   */
  async notifyGuest(
    eventsId: number,
    guestsId: number,
    payload: { title: string; body: string; data?: Record<string, string> },
  ) {
    if (!this.firebaseAdmin.isEnabled) return;

    try {
      const tokens = await this.deviceTokenRepo.find({ where: { eventsId, guestsId } });
      if (!tokens.length) return;

      const { invalidTokens } = await this.firebaseAdmin.sendToTokens(
        tokens.map((t) => t.deviceToken),
        payload,
      );

      if (invalidTokens.length) {
        await this.deviceTokenRepo.delete({ deviceToken: In(invalidTokens) });
        this.logger.debug(`Hapus ${invalidTokens.length} device token yang udah invalid`);
      }
    } catch (err) {
      this.logger.warn(
        `Gagal kirim push notification ke guest ${guestsId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
