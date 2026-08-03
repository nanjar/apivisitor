import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { In, Repository } from 'typeorm';
import { Agenda } from './entities/agenda.entity';
import { Track } from './entities/track.entity';
import { Session } from './entities/session.entity';
import { SessionSpeaker } from './entities/session-speaker.entity';
import { EventSpeaker } from '../speakers/entities/event-speaker.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Agenda) private readonly agendaRepo: Repository<Agenda>,
    @InjectRepository(Track) private readonly trackRepo: Repository<Track>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(SessionSpeaker)
    private readonly sessionSpeakerRepo: Repository<SessionSpeaker>,
    @InjectRepository(EventSpeaker)
    private readonly speakerRepo: Repository<EventSpeaker>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Event Schedule — rundown per hari (agenda) -> track -> session
  async getRundown(eventsId: number) {
    const [agendas, tracks, sessions] = await Promise.all([
      this.agendaRepo.find({ where: { eventsId }, order: { sortNo: 'ASC' } }),
      this.trackRepo.find({ where: { eventsId }, order: { sortNo: 'ASC' } }),
      this.sessionRepo.find({
        where: { eventsId, showOnRundown: 'Y' },
        order: { sortNo: 'ASC' },
      }),
    ]);

    return agendas.map((agenda) => ({
      agendaId: agenda.id,
      dayLabel: agenda.aliasName ?? agenda.agendaName,
      date: agenda.agendaDate,
      tracks: tracks
        .filter((t) => t.agendaId === agenda.id)
        .map((track) => ({
          trackId: track.id,
          trackLabel: track.aliasName ?? track.trackName,
          sessions: sessions
            .filter((s) => s.agendaId === agenda.id && s.trackId === track.id)
            .map((s) => ({
              sessionId: s.id,
              topic: s.sessionTopic,
              startTime: s.startTime,
              endTime: s.endTime,
              poster: s.poster,
              category: s.sessionCategory,
            })),
        })),
    }));
  }

  // Detail 1 sesi (dibuka dari card session di rundown)
  async getSessionDetail(eventsId: number, sessionId: number, trackId: number, agendaId: number) {
    const session = await this.sessionRepo.findOne({
      where: { eventsId, id: sessionId, trackId, agendaId },
    });
    if (!session) {
      throw new NotFoundException(this.i18n.t('messages.errors.sessionNotFound'));
    }

    const speakerLinks = await this.sessionSpeakerRepo.find({
      where: { eventsId, sessionId, trackId, agendaId },
    });
    const speakerIds = speakerLinks.map((l) => l.speakerId);
    const speakers = speakerIds.length
      ? await this.speakerRepo.find({ where: { eventsId, speakerId: In(speakerIds) } })
      : [];

    return {
      sessionId: session.id,
      topic: session.sessionTopic,
      brief: session.sessionBrief,
      startTime: session.startTime,
      endTime: session.endTime,
      poster: session.poster,
      moderator: session.moderator,
      youtubeLivestream: session.youtubeLivestream,
      speakers: speakers.map((sp) => ({
        speakerId: sp.speakerId,
        name: sp.speakerName,
        jobTitle: sp.jobTitle,
        photo: sp.photo,
      })),
    };
  }
}
