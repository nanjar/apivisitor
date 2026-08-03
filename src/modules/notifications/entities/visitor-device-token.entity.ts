import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visitor_device_token')
export class VisitorDeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'device_token', type: 'varchar', length: 255 })
  deviceToken: string;

  @Column({ name: 'platform', type: 'varchar', length: 10, default: 'unknown' })
  platform: 'ios' | 'android' | 'unknown';

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
