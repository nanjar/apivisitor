import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix: link_click_log ternyata perlu sampai ke MySQL juga (ada sistem
 * laporan lain yang ambil semua datanya dari MySQL, bukan Postgres).
 * Tambah pushed_at - tabel Postgres ini sekarang berfungsi ganda:
 * source of truth untuk apiexhibitor Reports (baca langsung), SEKALIGUS
 * staging untuk push-job ke MySQL link_click_log_sync. Gak perlu tabel
 * staging terpisah karena baris ini insert-only (gak pernah di-update).
 */
export class AddPushedAtToLinkClickLog1733040000000
  implements MigrationInterface
{
  name = 'AddPushedAtToLinkClickLog1733040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "link_click_log"
      ADD COLUMN IF NOT EXISTS "pushed_at" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_link_click_log_unpushed"
      ON "link_click_log" ("pushed_at")
      WHERE "pushed_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "link_click_log" DROP COLUMN IF EXISTS "pushed_at"
    `);
  }
}
