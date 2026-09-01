import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Menambahkan kolom `ev_token` ke tabel `events` (mirror dari MySQL).
 * ev_token = event key 6-digit yang dipakai untuk login exhibitor app
 * (event key + nomor HP -> match ke exhibitor.phone -> OTP WhatsApp).
 *
 * PENTING: kolom ini berfungsi seperti credential login, bukan data
 * referensi biasa. Entity Event menandainya `select: false` supaya
 * tidak pernah ikut ke response endpoint publik manapun secara default.
 *
 * Actual sync (copy nilai dari MySQL) dilakukan oleh visitor_app_backend,
 * TIDAK oleh migration ini — migration ini hanya menyiapkan kolomnya.
 */
export class AddEvTokenToEvents1732900000000 implements MigrationInterface {
  name = 'AddEvTokenToEvents1732900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "ev_token" varchar(200)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_events_ev_token" ON "events" ("ev_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_events_ev_token"
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "ev_token"
    `);
  }
}
