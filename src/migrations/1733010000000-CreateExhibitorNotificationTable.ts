import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabel native (BUKAN hasil sync) untuk notification bell exhibitor app.
 * Satu baris per PENERIMA (fan-out ke tiap exhibitor_id anggota company
 * yang relevan, bukan satu baris per company) - supaya unread count &
 * status "sudah dibaca" independen per orang.
 *
 * Trigger: meeting request baru (dari apivisitor/appointments) dan chat
 * message baru dari visitor (dari apivisitor/chat) - kedua app INSERT
 * langsung ke tabel shared ini, tidak perlu webhook/HTTP call karena
 * sama-sama connect ke Postgres yang sama.
 */
export class CreateExhibitorNotificationTable1733010000000
  implements MigrationInterface
{
  name = 'CreateExhibitorNotificationTable1733010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_notification" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "type" varchar(30) NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" varchar(500),
        "data" jsonb,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exhibitor_notification_recipient"
      ON "exhibitor_notification" ("events_id", "exhibitor_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exhibitor_notification_unread"
      ON "exhibitor_notification" ("events_id", "exhibitor_id")
      WHERE "is_read" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_notification"`);
  }
}
