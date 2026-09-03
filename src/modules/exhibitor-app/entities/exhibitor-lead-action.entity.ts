import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Staging table NATIVE untuk lead baru dari My Booth (scan/tambah manual)
 * DAN update notes lead yang sudah confirmed di mirror.
 *
 * action='CREATE': bikin lead baru. pushed_at NULL = belum diproses
 * push-job (INSERT exhibitor_lead_sync, dan kalau source SCAN/EVENT_GUEST
 * + ada guests_id, juga checkin_booth).
 *
 * action='UPDATE_NOTES': edit notes lead yang SUDAH confirmed (leadId =
 * id MySQL asli di exhibitor_lead_sync). Field lain (guestsId, source,
 * dst) tidak relevan untuk action ini.
 */
@Entity('exhibitor_app_lead_action')
export class ExhibitorLeadAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'venue_id', type: 'int' })
  venueId: number;

  @Column({ name: 'space_id', type: 'int' })
  spaceId: number;

  @Column({ name: 'actor_exhibitor_id', type: 'int' })
  actorExhibitorId: number;

  @Column({ name: 'guests_id', type: 'int', nullable: true })
  guestsId: number | null;

  @Column({ name: 'source', type: 'varchar', length: 15, nullable: true })
  source: 'SCAN' | 'EVENT_GUEST' | 'MANUAL' | null;

  @Column({ name: 'manual_fullname', type: 'varchar', length: 100, nullable: true })
  manualFullname: string | null;

  @Column({ name: 'manual_phone', type: 'varchar', length: 25, nullable: true })
  manualPhone: string | null;

  @Column({ name: 'manual_company', type: 'varchar', length: 200, nullable: true })
  manualCompany: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'action', type: 'varchar', length: 15, default: 'CREATE' })
  action: 'CREATE' | 'UPDATE_NOTES';

  @Column({ name: 'lead_id', type: 'int', nullable: true })
  leadId: number | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'pushed_at', type: 'timestamptz', nullable: true })
  pushedAt: Date | null;
}
