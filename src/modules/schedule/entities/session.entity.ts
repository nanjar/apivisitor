import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('new_session')
export class Session {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @PrimaryColumn({ name: 'track_id', type: 'int' })
  trackId: number;

  @PrimaryColumn({ name: 'agenda_id', type: 'int' })
  agendaId: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'session_topic', type: 'varchar', length: 100, nullable: true })
  sessionTopic: string | null;

  @Column({ name: 'session_brief', type: 'text', nullable: true })
  sessionBrief: string | null;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ name: 'poster', type: 'varchar', length: 100, nullable: true })
  poster: string | null;

  @Column({ name: 'moderator', type: 'varchar', length: 150, nullable: true })
  moderator: string | null;

  @Column({ name: 'session_category', type: 'varchar', length: 250, nullable: true })
  sessionCategory: string | null;

  @Column({ name: 'youtube_livestream', type: 'varchar', length: 250, nullable: true })
  youtubeLivestream: string | null;

  @Column({ name: 'show_on_rundown', type: 'varchar', length: 1, default: 'N' })
  showOnRundown: string;

  @Column({ name: 'sort_no', type: 'int', default: 1 })
  sortNo: number;
}
