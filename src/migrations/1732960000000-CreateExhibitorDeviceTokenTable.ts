import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabel native (BUKAN hasil sync) untuk device token FCM staff exhibitor
 * app - dicatat setiap login (event key + no. HP), dipakai nanti untuk
 * push notification (meeting baru, chat masuk, dst).
 *
 * Pola sama persis dengan visitor_device_token di apivisitor: kalau
 * device_id ditulis ke exhibitor_contact (tabel mirror), akan ketimpa
 * pull-sync berikutnya - itu masalah yang sama seperti kasus
 * guests_ticket.device_id yang sudah pernah kejadian.
 *
 * Satu exhibitor bisa punya lebih dari satu device aktif (HP + tablet
 * booth misalnya), makanya PK termasuk device_id, bukan cuma exhibitor_id.
 */
export class CreateExhibitorDeviceTokenTable1732960000000
  implements MigrationInterface
{
  name = 'CreateExhibitorDeviceTokenTable1732960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_device_token" (
        "events_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "device_id" varchar(255) NOT NULL,
        "platform" varchar(10),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_seen_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_exhibitor_device_token" PRIMARY KEY ("events_id", "exhibitor_id", "device_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exhibitor_device_token_lookup"
      ON "exhibitor_device_token" ("events_id", "exhibitor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_device_token"`);
  }
}
