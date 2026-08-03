import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('new_track')
export class Track {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @PrimaryColumn({ name: 'agenda_id', type: 'int' })
  agendaId: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'track_name', type: 'varchar', length: 100, nullable: true })
  trackName: string | null;

  @Column({ name: 'alias_name', type: 'varchar', length: 100, nullable: true })
  aliasName: string | null;

  @Column({ name: 'logo', type: 'varchar', length: 100, nullable: true })
  logo: string | null;

  @Column({ name: 'sort_no', type: 'int', default: 1 })
  sortNo: number;
}
