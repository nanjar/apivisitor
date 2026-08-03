import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visitor_facility')
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'venue_id', type: 'int', nullable: true })
  venueId: number | null;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'icon', type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({ name: 'category', type: 'varchar', length: 50, default: 'GENERAL' })
  category: 'RESTROOM' | 'PRAYER_ROOM' | 'FOOD' | 'MEDICAL' | 'ATM' | 'PARKING' | 'GENERAL';

  @Column({ name: 'floor_label', type: 'varchar', length: 100, nullable: true })
  floorLabel: string | null;

  @Column({ name: 'sort_no', type: 'int', default: 1 })
  sortNo: number;
}
