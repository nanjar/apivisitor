import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Tabel `events` legacy punya 200+ kolom (form builder generik).
 * Entity ini HANYA memetakan kolom yang dipakai Batch 1 (Splash banner,
 * Home Dashboard event banner + countdown, Explore context).
 *
 * Tipe kolom di bawah sudah dicocokkan ke struktur asli database
 * (dikonfirmasi via pgAdmin oleh user 30 Jul 2026) — bukan tebakan dari
 * dump SQL lagi. `header_logo` & `is_publish` TIDAK ADA di tabel asli
 * (sempat salah asumsi) — diganti `poster_mobile` & `status`.
 */
@Entity('events')
export class Event {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'ev_desc', type: 'text' })
  eventName: string;

  @Column({ name: 'ev_brief', type: 'text', nullable: true })
  eventBrief: string | null;

  @Column({ name: 'ev_startdate', type: 'timestamptz', nullable: true })
  eventStartDate: Date | null;

  @Column({ name: 'ev_enddate', type: 'timestamptz', nullable: true })
  eventEndDate: Date | null;

  @Column({ name: 'ev_venue', type: 'text', nullable: true })
  venueName: string | null;

  @Column({ name: 'ev_address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'detail_venue', type: 'text', nullable: true })
  detailVenue: string | null;

  @Column({ name: 'poster', type: 'text', nullable: true })
  bannerImage: string | null;

  @Column({ name: 'poster_mobile', type: 'text', nullable: true })
  bannerImageMobile: string | null;

  // 'A' = Active (default), kode lain belum terverifikasi semua
  // (kemungkinan 'D' = Draft/Deleted, dst) — treat 'A' sebagai "tayang".
  @Column({ name: 'status', type: 'varchar', length: 1, default: 'A' })
  status: string;

  // Event key 6-digit untuk login exhibitor app (event key + no. HP -> OTP WA).
  // select:false WAJIB - kolom ini setara credential, jangan pernah ikut
  // ke response query default. Select eksplisit hanya di service auth exhibitor.
  @Column({ name: 'ev_token', type: 'varchar', length: 200, nullable: true, select: false })
  evToken: string | null;
}
