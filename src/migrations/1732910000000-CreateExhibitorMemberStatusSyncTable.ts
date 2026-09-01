import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mirror dari tabel MySQL baru `exhibitor_member_status_sync`.
 * Menyimpan status keanggotaan booth (INVITED/ACTIVE/REMOVED) + permission
 * granular (can_scan, can_chat) untuk exhibitor app.
 *
 * Keputusan arsitektur (lihat diskusi ev_token & member management):
 * - TIDAK menambah kolom ke tabel `exhibitor` legacy (dipakai admin panel
 *   PHP, resiko positional INSERT patah kalau kolom baru ditambah).
 * - Tabel baru terpisah, mengikuti pola sync satu arah MySQL->Postgres
 *   yang sudah ada untuk 22 tabel lain di SyncModule.
 * - "_sync" di nama tabel = penanda tabel ini ikut proses sync
 *   (bukan tabel native murni Postgres seperti visitor_*).
 */
export class CreateExhibitorMemberStatusSyncTable1732910000000
  implements MigrationInterface
{
  name = 'CreateExhibitorMemberStatusSyncTable1732910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_member_status_sync" (
        "events_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "member_status" varchar(10) NOT NULL DEFAULT 'ACTIVE',
        "can_scan" char(1) NOT NULL DEFAULT 'Y',
        "can_chat" char(1) NOT NULL DEFAULT 'Y',
        "is_owner" char(1) NOT NULL DEFAULT 'N',
        "invited_by" int,
        "invited_at" timestamptz,
        "activated_at" timestamptz,
        "removed_at" timestamptz,
        "last_update" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_exhibitor_member_status_sync" PRIMARY KEY ("events_id", "exhibitor_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_member_status_sync_status"
      ON "exhibitor_member_status_sync" ("events_id", "member_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_member_status_sync"`);
  }
}
