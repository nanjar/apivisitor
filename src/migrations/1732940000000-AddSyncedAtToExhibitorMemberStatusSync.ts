import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FIX: migration CreateExhibitorMemberStatusSyncTable (1732910000000) lupa
 * menambahkan kolom synced_at yang WAJIB ada di semua tabel target sync -
 * dipakai SyncService untuk ON CONFLICT ... DO UPDATE SET synced_at = now()
 * dan delete-sweep (DELETE ... WHERE synced_at < cutoff).
 *
 * Ditemukan saat trigger sync manual pertama kali: "column synced_at does
 * not exist" (42703) persis di tabel ini.
 */
export class AddSyncedAtToExhibitorMemberStatusSync1732940000000
  implements MigrationInterface
{
  name = 'AddSyncedAtToExhibitorMemberStatusSync1732940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_member_status_sync"
      ADD COLUMN IF NOT EXISTS "synced_at" timestamptz NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_member_status_sync"
      DROP COLUMN IF EXISTS "synced_at"
    `);
  }
}
