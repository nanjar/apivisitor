import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dua tabel untuk fitur My Booth (lead management):
 *
 * 1. exhibitor_lead_sync (MIRROR, pull-sync dari MySQL) - source of truth
 *    untuk SEMUA lead (SCAN/EVENT_GUEST/MANUAL), independen dari
 *    checkin_booth. WAJIB ada synced_at (pernah kelewat sekali sebelumnya,
 *    jangan diulang).
 *
 * 2. exhibitor_app_lead_action (STAGING native) - exhibitor app insert ke
 *    sini dulu (scan/tambah manual), push-job yang proses ke MySQL
 *    (INSERT exhibitor_lead_sync + kalau source SCAN/EVENT_GUEST DAN ada
 *    guests_id, juga INSERT checkin_booth).
 */
export class CreateExhibitorLeadTables1732990000000
  implements MigrationInterface
{
  name = 'CreateExhibitorLeadTables1732990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_lead_sync" (
        "id" int NOT NULL,
        "events_id" int NOT NULL,
        "company_id" int NOT NULL,
        "venue_id" int NOT NULL,
        "space_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "guests_id" int,
        "source" varchar(15) NOT NULL,
        "manual_fullname" varchar(100),
        "manual_phone" varchar(25),
        "manual_company" varchar(200),
        "notes" text,
        "created_at" timestamptz NOT NULL,
        "last_update" timestamptz NOT NULL,
        "synced_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_exhibitor_lead_sync" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exhibitor_lead_sync_lookup"
      ON "exhibitor_lead_sync" ("events_id", "company_id", "venue_id", "space_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_app_lead_action" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "company_id" int NOT NULL,
        "venue_id" int NOT NULL,
        "space_id" int NOT NULL,
        "actor_exhibitor_id" int NOT NULL,
        "guests_id" int,
        "source" varchar(15) NOT NULL,
        "manual_fullname" varchar(100),
        "manual_phone" varchar(25),
        "manual_company" varchar(200),
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "pushed_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_lead_action_unpushed"
      ON "exhibitor_app_lead_action" ("pushed_at")
      WHERE "pushed_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_app_lead_action"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_lead_sync"`);
  }
}
