import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number; // guests_id
  eventsId: number;
  ticketId: number;
  email: string;
  fullname: string;
  // Fix Sept 2026: dibutuhkan buat push click-tracking ke tabel legacy
  // MySQL (instagram_clicked_v2 dkk) - itu guests_ticket.id, BUKAN
  // ticket_id. Satu guest bisa punya banyak tiket (token beda2), id ini
  // yang bedain baris spesifik tiket yang dipakai login.
  memberGuestsId: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(GuestTicket)
    private readonly guestTicketRepo: Repository<GuestTicket>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Login — visitor masukkan/scan token tiket, bukan email+password.
  async loginWithToken(dto: LoginDto) {
    const guest = await this.guestTicketRepo.findOne({
      where: { token: dto.token },
    });

    if (!guest) {
      throw new UnauthorizedException(this.i18n.t('messages.errors.invalidToken'));
    }
    // Hanya approval_status = 'AP' yang diizinkan masuk aplikasi — status
    // lain (PC/Pending Checkout, RJ/Rejected, dst) ditolak. Sengaja TIDAK
    // ikut cek kolom `paid` lagi — tiket gratis/komplimenter kemungkinan
    // paid-nya tetap 'N' walau approval_status udah 'AP', jadi kalau ikut
    // dicek bisa salah nolak visitor yang sah.
    if (guest.approvalStatus !== 'AP') {
      throw new UnauthorizedException(this.i18n.t('messages.errors.ticketNotApproved'));
    }

    return this.buildTokenResponse(guest);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(this.i18n.t('messages.errors.invalidOrExpiredRefreshToken'));
    }

    const guest = await this.guestTicketRepo.findOne({
      where: { guestsId: payload.sub, eventsId: payload.eventsId },
    });
    if (!guest) {
      throw new UnauthorizedException(this.i18n.t('messages.errors.visitorNotFound'));
    }

    return this.buildTokenResponse(guest);
  }

  private async buildTokenResponse(guest: GuestTicket) {
    const payload: JwtPayload = {
      sub: guest.guestsId,
      eventsId: guest.eventsId,
      ticketId: guest.ticketId,
      email: guest.email ?? '',
      fullname: guest.fullname ?? '',
      memberGuestsId: guest.id,
    };

    // CATATAN: access token SENGAJA gak dikasih `expiresIn` (no exp claim
    // di JWT-nya) — visitor gak perlu login ulang selama event berlangsung.
    // Konsekuensinya: gak ada mekanisme revoke per-visitor (mis. kalau
    // tiketnya dibatalkan/refund, token lama tetap valid selamanya) kecuali
    // rotate JWT_ACCESS_SECRET yang bakal nge-logout SEMUA visitor sekaligus.
    // Kalau nanti butuh revoke granular per-visitor, perlu tabel
    // token-blacklist/refresh-token-store — belum diimplementasikan.
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      visitor: {
        guestsId: guest.guestsId,
        eventsId: guest.eventsId,
        fullname: guest.fullname,
        email: guest.email,
      },
    };
  }
}
