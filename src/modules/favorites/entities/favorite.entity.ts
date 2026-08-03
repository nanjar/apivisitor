import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visitor_favorite')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'target_type', type: 'varchar', length: 10 })
  targetType: 'COMPANY' | 'PRODUCT';

  @Column({ name: 'target_id', type: 'int' })
  targetId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
