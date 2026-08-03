import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Preferensi visitor (bahasa, notifikasi) — gak ada di skema legacy,
 * tabel baru khusus visitor app. Nama di-prefix "visitor_" konsisten
 * sama pola Batch 4 (visitor_favorite, visitor_notification, visitor_facility)
 * buat hindari tabrakan nama sama tabel lain di database `corp`.
 */
export class CreateVisitorSettingsTable1732840000000 implements MigrationInterface {
  name = 'CreateVisitorSettingsTable1732840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "visitor_settings" (
        "events_id" int NOT NULL,
        "guests_id" int NOT NULL,
        "language" varchar(5) NOT NULL DEFAULT 'id',
        "push_notification_enabled" boolean NOT NULL DEFAULT true,
        "email_notification_enabled" boolean NOT NULL DEFAULT true,
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_visitor_settings" PRIMARY KEY ("events_id", "guests_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_settings"`);
  }
}
