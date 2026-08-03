import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visitor_notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int', nullable: true })
  guestsId: number | null; // NULL = broadcast

  @Column({ name: 'title', type: 'varchar', length: 150 })
  title: string;

  @Column({ name: 'body', type: 'varchar', length: 500 })
  body: string;

  @Column({ name: 'category', type: 'varchar', length: 30, default: 'GENERAL' })
  category: 'APPOINTMENT' | 'CHAT' | 'EVENT_UPDATE' | 'GENERAL';

  @Column({ name: 'reference_type', type: 'varchar', length: 30, nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
