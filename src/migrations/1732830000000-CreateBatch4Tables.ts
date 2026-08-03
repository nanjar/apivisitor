import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tiga tabel baru yang tidak ada di skema legacy — didesain khusus untuk
 * Undangin Visitor App (Batch 4: Favorites, Notifications, Facilities).
 *
 * Nama tabel di-prefix "visitor_" supaya tidak bentrok dengan tabel lain
 * yang mungkin sudah ada di database `corp` (kejadian nyata: nama polos
 * "favorite" sempat tabrakan dengan tabel legacy lain). CREATE TABLE
 * sengaja TANPA "IF NOT EXISTS" supaya kalau ada tabrakan nama lagi di
 * masa depan, migration langsung gagal keras/jelas — bukan diam-diam
 * skip lalu error random di query index sesudahnya.
 */
export class CreateBatch4Tables1732830000000 implements MigrationInterface {
  name = 'CreateBatch4Tables1732830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Favorites: visitor bisa favorite company ATAU product
    await queryRunner.query(`
      CREATE TABLE "visitor_favorite" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "guests_id" int NOT NULL,
        "target_type" varchar(10) NOT NULL, -- 'COMPANY' | 'PRODUCT'
        "target_id" int NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_visitor_favorite_target"
      ON "visitor_favorite" ("events_id", "guests_id", "target_type", "target_id")
    `);

    // Notifications: dikirim sistem (broadcast event) atau personal (appointment update, dsb)
    await queryRunner.query(`
      CREATE TABLE "visitor_notification" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "guests_id" int, -- NULL = broadcast ke semua visitor event ini
        "title" varchar(150) NOT NULL,
        "body" varchar(500) NOT NULL,
        "category" varchar(30) NOT NULL DEFAULT 'GENERAL', -- APPOINTMENT | CHAT | EVENT_UPDATE | GENERAL
        "reference_type" varchar(30), -- mis. 'MEETING', 'CHAT_ROOM'
        "reference_id" int,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_visitor_notification_recipient"
      ON "visitor_notification" ("events_id", "guests_id", "created_at")
    `);

    // Facilities: amenities event (toilet, mushola, nursery, ATM, dst)
    await queryRunner.query(`
      CREATE TABLE "visitor_facility" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "venue_id" int,
        "name" varchar(150) NOT NULL,
        "description" varchar(500),
        "icon" varchar(255),
        "category" varchar(50) NOT NULL DEFAULT 'GENERAL', -- RESTROOM | PRAYER_ROOM | FOOD | MEDICAL | ATM | PARKING | GENERAL
        "floor_label" varchar(100),
        "sort_no" int NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_visitor_facility_event"
      ON "visitor_facility" ("events_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_facility"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_notification"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_favorite"`);
  }
}
