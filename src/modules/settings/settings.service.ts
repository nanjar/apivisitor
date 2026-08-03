import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorSettings } from './entities/visitor-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(VisitorSettings)
    private readonly settingsRepo: Repository<VisitorSettings>,
  ) {}

  // Screen: Settings
  async getSettings(eventsId: number, guestsId: number): Promise<VisitorSettings> {
    const existing = await this.settingsRepo.findOne({ where: { eventsId, guestsId } });
    if (existing) return existing;

    // Belum pernah set apapun -> buat default row saat pertama kali diakses.
    // Ada celah race condition kecil kalau 2 request pertama kali datang
    // bersamaan (keduanya lihat "belum ada", keduanya coba insert) — PK
    // (events_id, guests_id) bakal nolak insert kedua, jadi kita tangkap
    // dan re-fetch aja daripada biarin 500.
    const created = this.settingsRepo.create({
      eventsId,
      guestsId,
      language: 'id',
      pushNotificationEnabled: true,
      emailNotificationEnabled: true,
      updatedAt: new Date(),
    });
    try {
      return await this.settingsRepo.save(created);
    } catch {
      const retryFetch = await this.settingsRepo.findOne({ where: { eventsId, guestsId } });
      if (retryFetch) return retryFetch;
      throw new Error('Gagal membuat/mengambil visitor settings');
    }
  }

  async updateSettings(
    eventsId: number,
    guestsId: number,
    dto: UpdateSettingsDto,
  ): Promise<VisitorSettings> {
    const settings = await this.getSettings(eventsId, guestsId);

    if (dto.language !== undefined) settings.language = dto.language;
    if (dto.pushNotificationEnabled !== undefined) {
      settings.pushNotificationEnabled = dto.pushNotificationEnabled;
    }
    if (dto.emailNotificationEnabled !== undefined) {
      settings.emailNotificationEnabled = dto.emailNotificationEnabled;
    }
    settings.updatedAt = new Date();

    return this.settingsRepo.save(settings);
  }
}
