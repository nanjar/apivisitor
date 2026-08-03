import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('visitor_settings')
export class VisitorSettings {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'language', type: 'varchar', length: 5, default: 'id' })
  language: string;

  @Column({ name: 'push_notification_enabled', type: 'boolean', default: true })
  pushNotificationEnabled: boolean;

  @Column({ name: 'email_notification_enabled', type: 'boolean', default: true })
  emailNotificationEnabled: boolean;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
