import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visitor_saved_session')
export class VisitorSavedSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @Column({ name: 'track_id', type: 'int' })
  trackId: number;

  @Column({ name: 'agenda_id', type: 'int' })
  agendaId: number;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
