import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * ASUMSI struktur kolom — tabel ini dibuat/di-sync sendiri oleh tim (bukan
 * lewat migration project ini), dan saat entity ini ditulis saya belum
 * sempat verifikasi kolomnya persis dari database asli. Kalau ternyata ada
 * mismatch nama kolom, bakal muncul error "column X does not exist" pas
 * dipakai — tinggal kabari, saya cocokkan lagi (pola yang sama kayak
 * exhcompany_space/location_address kemarin).
 */
@Entity('visitor_company_view_log')
export class VisitorCompanyViewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'viewed_at', type: 'timestamp' })
  viewedAt: Date;
}
