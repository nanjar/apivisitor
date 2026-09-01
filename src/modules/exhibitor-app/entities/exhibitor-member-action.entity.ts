import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Staging table NATIVE untuk aksi invite/activate/remove/restore anggota
 * booth. action: 'INVITE' | 'ACTIVATE' | 'REMOVE' | 'RESTORE'.
 * can_scan/can_chat opsional - hanya relevan untuk action INVITE/ACTIVATE
 * (set permission granular), NULL untuk REMOVE/RESTORE.
 *
 * pushed_at NULL = belum diproses push-job ke MySQL
 * exhibitor_member_status_sync.
 */
@Entity('exhibitor_app_member_action')
export class ExhibitorMemberAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'exhibitor_id', type: 'int' })
  exhibitorId: number;

  @Column({ name: 'action', type: 'varchar', length: 10 })
  action: 'INVITE' | 'ACTIVATE' | 'REMOVE' | 'RESTORE';

  @Column({ name: 'actor_exhibitor_id', type: 'int' })
  actorExhibitorId: number;

  @Column({ name: 'can_scan', type: 'char', length: 1, nullable: true })
  canScan: string | null;

  @Column({ name: 'can_chat', type: 'char', length: 1, nullable: true })
  canChat: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'pushed_at', type: 'timestamptz', nullable: true })
  pushedAt: Date | null;
}
