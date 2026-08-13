import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * "Add to My Schedule" di Speaker Detail / Event Schedule — visitor simpen
 * sesi yang mau didatengin ke jadwal pribadi mereka. Gak ada tabelnya di
 * skema legacy, jadi tabel baru khusus visitor app (pola sama kayak
 * visitor_favorite/visitor_notification/dst).
 *
 * PK komposit (session_id, track_id, agenda_id) karena session_id SENDIRI
 * gak unik lintas track/agenda (reset per track, sama kayak bug yang
 * pernah ketemu sebelumnya) — WAJIB simpen ketiganya biar gak ambigu pas
 * resolve balik ke sesi yang bener.
 */
export class CreateVisitorSavedSessionTable1732860000000 implements MigrationInterface {
  name = 'CreateVisitorSavedSessionTable1732860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "visitor_saved_session" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "guests_id" int NOT NULL,
        "session_id" int NOT NULL,
        "track_id" int NOT NULL,
        "agenda_id" int NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_visitor_saved_session"
      ON "visitor_saved_session" ("events_id", "guests_id", "session_id", "track_id", "agenda_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_saved_session"`);
  }
}
