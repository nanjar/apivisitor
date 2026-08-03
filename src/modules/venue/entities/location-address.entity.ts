import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Nama & alamat venue. Kolom `id` di sini konseptual = venue_id (dikonfirmasi
 * dari PK (id, events_id) yang polanya sama kayak venue_space.venue_id),
 * jadi bisa di-join ke `venue_space.venue_id` untuk dapat nama venue penuh.
 */
@Entity('location_address')
export class LocationAddress {
  @PrimaryColumn({ name: 'id', type: 'int' })
  venueId: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'ev_venue', type: 'varchar', length: 100, nullable: true })
  venueName: string | null;

  @Column({ name: 'ev_address', type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'ev_lat', type: 'varchar', length: 45, nullable: true })
  lat: string | null;

  @Column({ name: 'ev_long', type: 'varchar', length: 45, nullable: true })
  long: string | null;

  @Column({ name: 'default_address', type: 'varchar', length: 1, nullable: true })
  defaultAddress: string | null;
}
