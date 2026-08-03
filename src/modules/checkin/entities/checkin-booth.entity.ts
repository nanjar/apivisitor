import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Riwayat visitor discan QR badge-nya oleh exhibitor di boothnya.
 * `exhibitor_id` = company_id yang punya booth (venue_id + space_id).
 * Tabel ini juga jadi sumber resolve relasi Company <-> Booth yang
 * sebelumnya dicatat sebagai gap — 1 company biasanya konsisten pakai
 * venue_id/space_id yang sama di semua baris checkin miliknya.
 */
@Entity('checkin_booth')
export class CheckinBooth {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'exhibitor_id', type: 'int' })
  exhibitorId: number;

  @PrimaryColumn({ name: 'venue_id', type: 'int' })
  venueId: number;

  @PrimaryColumn({ name: 'space_id', type: 'int' })
  spaceId: number;

  @PrimaryColumn({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @PrimaryColumn({ name: 'company_id', type: 'int' })
  companyId: number;

  @PrimaryColumn({ name: 'member_id', type: 'int' })
  memberId: number;

  @Column({ name: 'scan_by', type: 'varchar', length: 45, nullable: true })
  scanBy: string | null;

  @Column({ name: 'checkin_datetime', type: 'timestamptz', nullable: true })
  checkinDatetime: Date | null;

  @Column({ name: 'souvenir', type: 'varchar', length: 1, default: 'N' })
  souvenir: string;

  @Column({ name: 'visitor_notes', type: 'text', nullable: true })
  visitorNotes: string | null;
}
