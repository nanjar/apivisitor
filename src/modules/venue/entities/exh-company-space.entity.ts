import { Entity, PrimaryColumn } from 'typeorm';

/**
 * Mapping RESMI company -> booth (venue_id + space_id), ditentukan
 * organizer/exhibitor pas assign booth — bukan riwayat scan visitor
 * (beda sama `checkin_booth` yang isinya histori kunjungan).
 *
 * PK komposit (events_id, venue_id, space_id, company_id) — 1 company
 * SECARA TEKNIS bisa punya lebih dari 1 baris (data real ada contohnya),
 * jadi kalau assign booth-nya emang 1:1 per company, ambil baris pertama
 * aja sebagai representasi utama.
 */
@Entity('exhcompany_space')
export class ExhCompanySpace {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'venue_id', type: 'int' })
  venueId: number;

  @PrimaryColumn({ name: 'space_id', type: 'int' })
  spaceId: number;

  @PrimaryColumn({ name: 'company_id', type: 'int' })
  companyId: number;
}
