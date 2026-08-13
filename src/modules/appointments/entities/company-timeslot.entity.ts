import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Slot waktu yang DIBUKA exhibitor buat company tertentu di 1 agenda/hari
 * (bukan slot generik event-wide). `is_enabled` = exhibitor aktifin slot
 * ini, `booked` = slot ini udah diambil visitor lain.
 */
@Entity('company_timeslot')
export class CompanyTimeslot {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'company_id', type: 'int' })
  companyId: number;

  @PrimaryColumn({ name: 'agenda_id', type: 'int' })
  agendaId: number;

  @PrimaryColumn({ name: 'time_slot', type: 'time' })
  timeSlot: string;

  @Column({ name: 'is_enabled', type: 'varchar', length: 1, default: 'Y' })
  isEnabled: string;

  @Column({ name: 'booked', type: 'varchar', length: 1, default: 'N' })
  booked: string;

  @Column({ name: 'last_update', type: 'timestamptz', nullable: true })
  lastUpdate: Date | null;
}
