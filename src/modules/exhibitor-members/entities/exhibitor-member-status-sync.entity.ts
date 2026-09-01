import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Mirror dari MySQL `exhibitor_member_status_sync` (satu arah, MySQL->Postgres).
 * Status keanggotaan booth exhibitor app: INVITED / ACTIVE / REMOVED,
 * plus permission granular (can_scan, can_chat) dan penanda pemilik booth.
 *
 * Ditulis oleh sync cron (visitor_app_backend). Write dari exhibitor app
 * (invite/activate/remove member) ATURANNYA SAMA seperti meeting & chat:
 * native Postgres dulu ke tabel staging terpisah, lalu push-job periodik
 * menulis balik ke MySQL - JANGAN pernah tulis langsung ke tabel ini.
 */
@Entity('exhibitor_member_status_sync')
export class ExhibitorMemberStatusSync {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'exhibitor_id', type: 'int' })
  exhibitorId: number;

  @Column({ name: 'member_status', type: 'varchar', length: 10, default: 'ACTIVE' })
  memberStatus: 'INVITED' | 'ACTIVE' | 'REMOVED';

  @Column({ name: 'can_scan', type: 'char', length: 1, default: 'Y' })
  canScan: string;

  @Column({ name: 'can_chat', type: 'char', length: 1, default: 'Y' })
  canChat: string;

  @Column({ name: 'is_owner', type: 'char', length: 1, default: 'N' })
  isOwner: string;

  @Column({ name: 'invited_by', type: 'int', nullable: true })
  invitedBy: number | null;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt: Date | null;

  @Column({ name: 'last_update', type: 'timestamptz' })
  lastUpdate: Date;
}
