import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabel staging NATIVE Postgres untuk exhibitor app: approve/reject meeting
 * & kirim chat. Keputusan arsitektur: native Postgres dulu, push-job periodik
 * menulis balik ke MySQL (events_meeting_v2 / events_chat / events_chatmember_v2).
 *
 * JANGAN tulis langsung ke tabel mirror (events_meeting_v2 dst) - akan
 * ke-overwrite pull-cron sync berikutnya. Alur: exhibitor app -> insert ke
 * sini -> push-job (di visitor_app_backend) baca WHERE pushed_at IS NULL ->
 * tulis ke MySQL -> UPDATE pushed_at = now() di sini.
 */
export class CreateExhibitorAppActionStagingTables1732920000000
  implements MigrationInterface
{
  name = 'CreateExhibitorAppActionStagingTables1732920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_app_meeting_action" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "meeting_id" int NOT NULL,
        "action" varchar(10) NOT NULL,
        "actor_exhibitor_id" int NOT NULL,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "pushed_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_meeting_action_unpushed"
      ON "exhibitor_app_meeting_action" ("pushed_at")
      WHERE "pushed_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_meeting_action_lookup"
      ON "exhibitor_app_meeting_action" ("events_id", "meeting_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exhibitor_app_chat_message" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "chat_id" int NOT NULL,
        "sender_exhibitor_id" int NOT NULL,
        "message" text NOT NULL,
        "attachment_url" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "pushed_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_chat_message_unpushed"
      ON "exhibitor_app_chat_message" ("pushed_at")
      WHERE "pushed_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exh_chat_message_lookup"
      ON "exhibitor_app_chat_message" ("events_id", "chat_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_app_chat_message"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_app_meeting_action"`);
  }
}
