import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { EventSpeaker } from './entities/event-speaker.entity';
import { SessionSpeaker } from '../schedule/entities/session-speaker.entity';
import { Session } from '../schedule/entities/session.entity';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectRepository(EventSpeaker) private readonly speakerRepo: Repository<EventSpeaker>,
    @InjectRepository(SessionSpeaker)
    private readonly sessionSpeakerRepo: Repository<SessionSpeaker>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    private readonly i18n: I18nService,
  ) {}

  async list(eventsId: number) {
    const speakers = await this.speakerRepo.find({
      where: { eventsId, approvalStatus: 'AP' },
      order: { speakerName: 'ASC' },
    });
    return speakers.map((s) => ({
      speakerId: s.speakerId,
      name: s.speakerName,
      jobTitle: s.jobTitle,
      companyName: s.companyName,
      photo: s.photo,
    }));
  }

  // Screen: Speaker Detail
  async getDetail(eventsId: number, speakerId: number) {
    const speaker = await this.speakerRepo.findOne({ where: { eventsId, speakerId } });
    if (!speaker) {
      throw new NotFoundException(this.i18n.t('messages.errors.speakerNotFound'));
    }

    const sessionLinks = await this.sessionSpeakerRepo.find({ where: { eventsId, speakerId } });
    // PENTING: `new_session.id` TIDAK unik per event — dia reset per
    // track/agenda (PK aslinya (id, track_id, agenda_id, events_id)).
    // Jadi tidak bisa filter sesi cuma pakai `id` + `eventsId` — harus ikut
    // sertakan trackId & agendaId dari session_speaker, kalau tidak bisa
    // ketuker sama sesi lain yang kebetulan id-nya sama di track berbeda.
    const sessions = sessionLinks.length
      ? await this.sessionRepo.find({
          where: sessionLinks.map((link) => ({
            eventsId,
            id: link.sessionId,
            trackId: link.trackId,
            agendaId: link.agendaId,
          })),
        })
      : [];

    return {
      speakerId: speaker.speakerId,
      name: speaker.speakerName,
      jobTitle: speaker.jobTitle,
      companyName: speaker.companyName,
      email: speaker.speakerEmail,
      phone: speaker.speakerPhone,
      photo: speaker.photo,
      bio: speaker.bio,
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        topic: s.sessionTopic,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };
  }
}
