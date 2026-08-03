import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Notifications — gabungan broadcast (guestsId NULL) + personal
  async list(eventsId: number, guestsId: number) {
    const notifications = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.eventsId = :eventsId', { eventsId })
      .andWhere('(n.guestsId = :guestsId OR n.guestsId IS NULL)', { guestsId })
      .orderBy('n.createdAt', 'DESC')
      .take(100)
      .getMany();

    return notifications;
  }

  async unreadCount(eventsId: number, guestsId: number) {
    const count = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.eventsId = :eventsId', { eventsId })
      .andWhere('(n.guestsId = :guestsId OR n.guestsId IS NULL)', { guestsId })
      .andWhere('n.isRead = false')
      .getCount();
    return { unreadCount: count };
  }

  async markAsRead(eventsId: number, guestsId: number, id: number) {
    const notification = await this.notificationRepo.findOne({ where: { id, eventsId } });
    if (!notification) {
      throw new NotFoundException(this.i18n.t('messages.errors.notificationNotFound'));
    }
    // Notifikasi personal hanya boleh ditandai oleh pemiliknya; broadcast
    // (guestsId NULL) boleh ditandai read oleh siapapun yang membacanya
    // — tapi karena baris broadcast dishare semua visitor, idealnya nanti
    // dipecah jadi tabel read-state terpisah kalau butuh per-user read flag
    // untuk broadcast. Untuk sekarang cukup untuk notifikasi personal.
    if (notification.guestsId !== null && notification.guestsId !== guestsId) {
      throw new NotFoundException(this.i18n.t('messages.errors.notificationNotFound'));
    }
    notification.isRead = true;
    await this.notificationRepo.save(notification);
    return notification;
  }
}
