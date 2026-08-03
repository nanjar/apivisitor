import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Mapping dari tabel legacy `guests_ticket` (sudah di-sync ke Postgres).
 * PK asli komposit: (guests_id, events_id, id, ticket_id).
 *
 * Auth visitor app TIDAK pakai email/password — visitor login memakai
 * `token` unik yang sudah digenerate sistem tiketing saat mereka beli
 * tiket (kolom `token` sudah ada di skema asli, tidak perlu migration
 * tambahan untuk auth).
 */
@Entity('guests_ticket')
export class GuestTicket {
  @PrimaryColumn({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @PrimaryColumn({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @Column({ name: 'fullname', type: 'varchar', length: 100, nullable: true })
  fullname: string | null;

  @Column({ name: 'email', type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ name: 'token', type: 'varchar', length: 255, nullable: true })
  token: string | null;

  @Column({ name: 'created', type: 'timestamptz' })
  created: Date;

  @Column({ name: 'paid', type: 'varchar', length: 1, default: 'N' })
  paid: string;

  @Column({ name: 'approval_status', type: 'varchar', length: 2, default: 'PC' })
  approvalStatus: string;

  @Column({ name: 'country_code', type: 'varchar', length: 10, nullable: true })
  countryCode: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 25, nullable: true })
  phone: string | null;

  @Column({ name: 'company_name', type: 'varchar', length: 200, nullable: true })
  companyName: string | null;

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
