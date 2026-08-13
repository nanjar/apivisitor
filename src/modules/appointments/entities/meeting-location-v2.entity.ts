import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('meeting_location_v2')
export class MeetingLocationV2 {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'location_id', type: 'int' })
  locationId: number;

  @Column({ name: 'location_name', type: 'text', nullable: true })
  locationName: string | null;

  @Column({ name: 'is_enabled', type: 'varchar', length: 1, default: 'Y' })
  isEnabled: string;

  @Column({ name: 'sort_no', type: 'int', default: 1 })
  sortNo: number;
}
