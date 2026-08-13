import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { In, Repository } from 'typeorm';
import { Agenda } from './entities/agenda.entity';
import { Track } from './entities/track.entity';
import { Session } from './entities/session.entity';
import { SessionSpeaker } from './entities/session-speaker.entity';
import { EventSpeaker } from '../speakers/entities/event-speaker.entity';
import { VisitorSavedSession } from './entities/visitor-saved-session.entity';
import { ScheduleQueryDto } from './dto/schedule-query.dto';

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
    @InjectRepository(VisitorSavedSession)
    private readonly savedSessionRepo: Repository<VisitorSavedSession>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Event Schedule — rundown per hari (agenda) -> track -> session.
  // Support search (keyword di NAMA HARI/agenda, NAMA TRACK, DAN judul
  // sesi sekaligus — kalau keyword match nama agenda/track, semua sesi di
  // bawahnya ikut nongol, bukan cuma sesi yang judulnya persis match) dan
  // filter chip (agendaId, trackId).
  async getRundown(eventsId: number, query: ScheduleQueryDto = {}) {
    const agendaWhere: Record<string, unknown> = { eventsId };
    if (query.agendaId !== undefined) agendaWhere.id = query.agendaId;

    const [agendas, tracks] = await Promise.all([
      this.agendaRepo.find({ where: agendaWhere, order: { sortNo: 'ASC' } }),
      this.trackRepo.find({ where: { eventsId }, order: { sortNo: 'ASC' } }),
    ]);

    let matchedAgendaIds: Set<number> | null = null;
    let matchedTrackIds: Set<number> | null = null;
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      matchedAgendaIds = new Set(
        agendas
          .filter(
            (a) =>
              a.agendaName?.toLowerCase().includes(kw) || a.aliasName?.toLowerCase().includes(kw),
          )
          .map((a) => a.id),
      );
      matchedTrackIds = new Set(
        tracks
          .filter(
            (t) =>
              t.trackName?.toLowerCase().includes(kw) || t.aliasName?.toLowerCase().includes(kw),
          )
          .map((t) => t.id),
      );
    }

    // Sesi match kalau: judulnya sendiri match keyword, ATAU dia ada di
    // bawah agenda/track yang namanya match keyword.
    const sessionQb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.eventsId = :eventsId', { eventsId })
      .andWhere('s.showOnRundown = :show', { show: 'Y' });
    if (query.agendaId !== undefined) {
      sessionQb.andWhere('s.agendaId = :agendaId', { agendaId: query.agendaId });
    }
    if (query.trackId !== undefined) {
      sessionQb.andWhere('s.trackId = :trackId', { trackId: query.trackId });
    }
    if (query.keyword) {
      const orParts = ['s.sessionTopic ILIKE :kw'];
      const params: Record<string, unknown> = { kw: `%${query.keyword}%` };
      if (matchedAgendaIds!.size) {
        orParts.push('s.agendaId IN (:...matchedAgendaIds)');
        params.matchedAgendaIds = [...matchedAgendaIds!];
      }
      if (matchedTrackIds!.size) {
        orParts.push('s.trackId IN (:...matchedTrackIds)');
        params.matchedTrackIds = [...matchedTrackIds!];
      }
      sessionQb.andWhere(`(${orParts.join(' OR ')})`, params);
    }
    const sessions = await sessionQb.orderBy('s.sortNo', 'ASC').getMany();

    // Kalau lagi search/filter, track & hari yang gak punya sesi match
    // disembunyiin (biar hasil search rapi) — kalau gak ada filter aktif,
    // tampilin semua kayak biasa (termasuk track/hari kosong).
    const isFiltering = !!(query.keyword || query.trackId !== undefined);

    return agendas
      .map((agenda) => {
        const agendaTracks = tracks
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
          }))
          .filter((t) => !isFiltering || t.sessions.length > 0);

        return {
          agendaId: agenda.id,
          dayLabel: agenda.aliasName ?? agenda.agendaName,
          date: agenda.agendaDate,
          tracks: agendaTracks,
        };
      })
      .filter((a) => !isFiltering || a.tracks.length > 0);
  }

  // Screen: Event Schedule -> filter chip Track (gantiin kategori, lebih
  // simpel buat visitor). Di-scope per agenda karena track bisa beda-beda
  // isinya tiap hari — kalau agendaId gak dikasih, balikin semua track
  // di event ini.
  async getTracks(eventsId: number, agendaId?: number) {
    const tracks = await this.trackRepo.find({
      where: agendaId !== undefined ? { eventsId, agendaId } : { eventsId },
      order: { sortNo: 'ASC' },
    });
    return tracks.map((t) => ({
      trackId: t.id,
      agendaId: t.agendaId,
      label: t.aliasName ?? t.trackName,
    }));
  }

  // Detail 1 sesi (dibuka dari card session di rundown)
  async getSessionDetail(
    eventsId: number,
    sessionId: number,
    trackId: number,
    agendaId: number,
    guestsId?: number,
  ) {
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

    const isSaved = guestsId
      ? !!(await this.savedSessionRepo.findOne({
          where: { eventsId, guestsId, sessionId, trackId, agendaId },
        }))
      : false;

    return {
      sessionId: session.id,
      topic: session.sessionTopic,
      brief: session.sessionBrief,
      startTime: session.startTime,
      endTime: session.endTime,
      poster: session.poster,
      moderator: session.moderator,
      youtubeLivestream: session.youtubeLivestream,
      isSaved,
      speakers: speakers.map((sp) => ({
        speakerId: sp.speakerId,
        name: sp.speakerName,
        jobTitle: sp.jobTitle,
        photo: sp.photo,
      })),
    };
  }

  // Screen: Speaker Detail / Event Schedule -> tombol "Add to My Schedule"
  async saveSession(
    eventsId: number,
    guestsId: number,
    sessionId: number,
    trackId: number,
    agendaId: number,
  ) {
    const session = await this.sessionRepo.findOne({
      where: { eventsId, id: sessionId, trackId, agendaId },
    });
    if (!session) {
      throw new NotFoundException(this.i18n.t('messages.errors.sessionNotFound'));
    }

    const existing = await this.savedSessionRepo.findOne({
      where: { eventsId, guestsId, sessionId, trackId, agendaId },
    });
    if (existing) {
      return { saved: true };
    }

    await this.savedSessionRepo.save(
      this.savedSessionRepo.create({
        eventsId,
        guestsId,
        sessionId,
        trackId,
        agendaId,
        createdAt: new Date(),
      }),
    );
    return { saved: true };
  }

  async unsaveSession(
    eventsId: number,
    guestsId: number,
    sessionId: number,
    trackId: number,
    agendaId: number,
  ) {
    await this.savedSessionRepo.delete({ eventsId, guestsId, sessionId, trackId, agendaId });
    return { saved: false };
  }

  // Screen: "My Schedule" — sesi yang udah disimpen visitor, diurutin
  // sesuai tanggal+jam (bukan urutan disimpennya)
  async getMySchedule(eventsId: number, guestsId: number) {
    const saved = await this.savedSessionRepo.find({ where: { eventsId, guestsId } });
    if (!saved.length) return [];

    // session_id gak unik lintas track/agenda — resolve tiap sesi pakai
    // composite key penuh (id + trackId + agendaId), jangan cuma id.
    const sessions = await this.sessionRepo.find({
      where: saved.map((s) => ({
        eventsId,
        id: s.sessionId,
        trackId: s.trackId,
        agendaId: s.agendaId,
      })),
    });
    const agendaIds = [...new Set(saved.map((s) => s.agendaId))];
    const agendas = await this.agendaRepo.find({ where: { eventsId, id: In(agendaIds) } });
    const agendaMap = new Map(agendas.map((a) => [a.id, a]));

    const sessionMap = new Map(
      sessions.map((s) => [`${s.id}-${s.trackId}-${s.agendaId}`, s]),
    );

    return saved
      .map((link) => {
        const session = sessionMap.get(`${link.sessionId}-${link.trackId}-${link.agendaId}`);
        if (!session) return null;
        const agenda = agendaMap.get(link.agendaId);
        return {
          sessionId: session.id,
          trackId: link.trackId,
          agendaId: link.agendaId,
          topic: session.sessionTopic,
          startTime: session.startTime,
          endTime: session.endTime,
          poster: session.poster,
          dayLabel: agenda?.aliasName ?? agenda?.agendaName ?? null,
          date: agenda?.agendaDate ?? null,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => {
        const dateCompare = (a.date ?? '').localeCompare(b.date ?? '');
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime ?? '').localeCompare(b.startTime ?? '');
      });
  }
}
