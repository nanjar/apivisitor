import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Staging table native untuk aksi manajemen anggota booth (invite/
 * activate/remove/restore) dari exhibitor app.
 *
 * Alasan sama seperti exhibitor_app_meeting_action & exhibitor_app_chat_message:
 * exhibitor_member_status_sync di Postgres adalah MIRROR hasil pull-sync,
 * jadi tidak boleh ditulis langsung - akan ke-overwrite cron berikutnya.
 * Exhibitor app insert ke sini -> push-job baca WHERE pushed_at IS NULL ->
 * tulis ke MySQL exhibitor_member_status_sync -> update pushed_at.
 */
export class CreateExhibitorAppMemberActionTable1732930000000
  implements MigrationInterface
{
  name = 'CreateExhibitorAppMemberActionTable1732930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_app_member_action" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "exhibitor_id" int NOT NULL,
        "action" varchar(10) NOT NULL,
        "actor_exhibitor_id" int NOT NULL,
        "can_scan" char(1),
        "can_chat" char(1),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "pushed_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_member_action_unpushed"
      ON "exhibitor_app_member_action" ("pushed_at")
      WHERE "pushed_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_member_action_lookup"
      ON "exhibitor_app_member_action" ("events_id", "exhibitor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_app_member_action"`);
  }
}
