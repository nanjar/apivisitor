import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('interest_options')
export class InterestOption {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'interest_id', type: 'int' })
  interestId: number;

  @Column({ name: 'interest_options', type: 'text', nullable: true })
  label: string | null;

  @Column({ name: 'sort_no', type: 'int', default: 1 })
  sortNo: number;

  @Column({ name: 'is_enabled', type: 'varchar', length: 1, default: 'Y' })
  isEnabled: string;

  // Belum jelas semantiknya (FK ke apa persis) — disimpan apa adanya,
  // TIDAK dipakai buat filter sampai ada klarifikasi lebih lanjut.
  @Column({ name: 'interest_for', type: 'int', nullable: true })
  interestFor: number | null;
}
