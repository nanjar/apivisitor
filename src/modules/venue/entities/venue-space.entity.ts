import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * `space_name` menyimpan nomor booth (mis. "A-120"), sedangkan nama Hall
 * (mis. "Hall A") ada di tabel venue (venue_id) yang belum dikirim.
 * Untuk sementara `hallLabel` di-resolve di service layer dari venue_id,
 * atau tunggu tabel `venue` dikirim untuk join proper.
 */
@Entity('venue_space')
export class VenueSpace {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @PrimaryColumn({ name: 'venue_id', type: 'int' })
  venueId: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'space_name', type: 'varchar', length: 100, nullable: true })
  spaceName: string | null;

  @Column({ name: 'space_details', type: 'varchar', length: 255, nullable: true })
  spaceDetails: string | null;

  @Column({ name: 'space_type', type: 'varchar', length: 2 })
  spaceType: string; // 'BO' = Booth, 'RO' = Room

  @Column({ name: 'logo', type: 'varchar', length: 100, nullable: true })
  logo: string | null;
}
