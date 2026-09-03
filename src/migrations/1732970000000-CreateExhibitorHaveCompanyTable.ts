import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mirror dari MySQL exhibitor_have_company - junction table murni.
 * Satu exhibitor_contact bisa mewakili lebih dari satu company
 * (exhibitor_contact.company_id ternyata cuma "company utama" legacy,
 * bukan daftar lengkap - baru ketahuan Sept 2026 saat desain login
 * exhibitor app).
 *
 * WAJIB ada kolom synced_at (pernah kelewat sekali di migration
 * exhibitor_member_status_sync, jangan diulang - lihat migration
 * 1732940000000 buat konteks errornya).
 */
export class CreateExhibitorHaveCompanyTable1732970000000
  implements MigrationInterface
{
  name = 'CreateExhibitorHaveCompanyTable1732970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_have_company" (
        "events_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "company_id" int NOT NULL,
        "synced_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_exhibitor_have_company" PRIMARY KEY ("events_id", "exhibitor_id", "company_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exhibitor_have_company_lookup"
      ON "exhibitor_have_company" ("events_id", "exhibitor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_have_company"`);
  }
}
