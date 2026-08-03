import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(GuestTicket) private readonly guestTicketRepo: Repository<GuestTicket>,
    @InjectRepository(CheckinBooth) private readonly checkinRepo: Repository<CheckinBooth>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: QR Badge — isi QR code = token tiket (sama dengan yang dipakai
  // login), di-scan exhibitor untuk insert baris baru ke checkin_booth.
  async getBadge(eventsId: number, guestsId: number) {
    const guest = await this.guestTicketRepo.findOne({ where: { eventsId, guestsId } });
    if (!guest) {
      throw new NotFoundException(this.i18n.t('messages.errors.visitorNotFound'));
    }

    return {
      qrValue: guest.token,
      fullname: guest.fullname,
      companyName: guest.companyName,
      ticketId: guest.ticketId,
    };
  }

  // Riwayat booth yang sudah di-visit/checkin (ditampilkan di bawah QR atau
  // di Profile) — bukti kunjungan booth
  async getCheckinHistory(eventsId: number, guestsId: number) {
    const checkins = await this.checkinRepo.find({
      where: { eventsId, guestsId },
      order: { checkinDatetime: 'DESC' },
    });
    if (!checkins.length) return [];

    const companyIds = [...new Set(checkins.map((c) => c.companyId))];
    const companies = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.id IN (:...ids)', { ids: companyIds })
      .getMany();
    const companyMap = new Map(companies.map((c) => [c.id, c.companyName]));

    return checkins.map((c) => ({
      companyId: c.companyId,
      companyName: companyMap.get(c.companyId) ?? null,
      checkinDatetime: c.checkinDatetime,
      souvenirReceived: c.souvenir === 'Y',
    }));
  }
}
