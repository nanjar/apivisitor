import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Simpan FCM device token per visitor per device — 1 visitor bisa login di
 * beberapa device (HP + tablet misalnya), jadi PK bukan per-guest tapi per
 * token (device_token unique). Push notification dikirim ke SEMUA device
 * token aktif milik guest tsb.
 */
export class CreateVisitorDeviceTokenTable1732850000000 implements MigrationInterface {
  name = 'CreateVisitorDeviceTokenTable1732850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "visitor_device_token" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "guests_id" int NOT NULL,
        "device_token" varchar(255) NOT NULL,
        "platform" varchar(10) NOT NULL DEFAULT 'unknown', -- 'ios' | 'android' | 'unknown'
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_visitor_device_token"
      ON "visitor_device_token" ("device_token")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_visitor_device_token_guest"
      ON "visitor_device_token" ("events_id", "guests_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_device_token"`);
  }
}
