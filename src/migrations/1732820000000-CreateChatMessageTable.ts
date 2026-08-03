import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabel legacy `events_chat` hanya simpan SNAPSHOT pesan terakhir per room
 * (lastSender, message, totalPost) — tidak ada history pesan granular.
 * Tabel baru ini dibuat khusus untuk Undangin Visitor App agar Chat Room
 * bisa nampilin history percakapan penuh.
 */
export class CreateChatMessageTable1732820000000 implements MigrationInterface {
  name = 'CreateChatMessageTable1732820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_message" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "chat_id" int NOT NULL,
        "sender_member_id" int NOT NULL,
        "sender_name" varchar(200) NOT NULL,
        "sender_type" varchar(2) NOT NULL, -- 'VI' visitor, 'EX' exhibitor
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chat_message_room"
      ON "chat_message" ("events_id", "chat_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_message"`);
  }
}
