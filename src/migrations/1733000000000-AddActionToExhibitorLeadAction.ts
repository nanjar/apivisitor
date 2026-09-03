import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tambah action + lead_id ke exhibitor_app_lead_action supaya bisa
 * bedakan CREATE (bikin lead baru) vs UPDATE_NOTES (edit notes lead yang
 * SUDAH confirmed di mirror, ditarget pakai id MySQL asli).
 *
 * Dikonfirmasi Sept 2026: input scan pakai token QR (bukan guests_id
 * langsung), notes diisi belakangan lewat update terpisah - bukan bagian
 * dari scan awal.
 */
export class AddActionToExhibitorLeadAction1733000000000
  implements MigrationInterface
{
  name = 'AddActionToExhibitorLeadAction1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_lead_action"
      ADD COLUMN IF NOT EXISTS "action" varchar(15) NOT NULL DEFAULT 'CREATE'
    `);
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_lead_action"
      ADD COLUMN IF NOT EXISTS "lead_id" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_lead_action" DROP COLUMN IF EXISTS "lead_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_lead_action" DROP COLUMN IF EXISTS "action"
    `);
  }
}
