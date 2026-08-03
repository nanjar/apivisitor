import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(GuestTicket) private readonly guestTicketRepo: Repository<GuestTicket>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Profile
  async getProfile(eventsId: number, guestsId: number) {
    const guest = await this.guestTicketRepo.findOne({ where: { eventsId, guestsId } });
    if (!guest) {
      throw new NotFoundException(this.i18n.t('messages.errors.visitorNotFound'));
    }
    return {
      guestsId: guest.guestsId,
      fullname: guest.fullname,
      email: guest.email,
      phone: guest.phone ? `${guest.countryCode ?? ''}${guest.phone}` : null,
      companyName: guest.companyName,
      ticketId: guest.ticketId,
    };
  }

  async updateProfile(eventsId: number, guestsId: number, dto: UpdateProfileDto) {
    const guest = await this.guestTicketRepo.findOne({ where: { eventsId, guestsId } });
    if (!guest) {
      throw new NotFoundException(this.i18n.t('messages.errors.visitorNotFound'));
    }

    if (dto.fullname !== undefined) guest.fullname = dto.fullname;
    if (dto.phone !== undefined) guest.phone = dto.phone;
    if (dto.companyName !== undefined) guest.companyName = dto.companyName;
    guest.updatedAt = new Date();

    await this.guestTicketRepo.save(guest);
    return this.getProfile(eventsId, guestsId);
  }
}
