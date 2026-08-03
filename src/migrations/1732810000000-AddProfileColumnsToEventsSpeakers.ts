import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileColumnsToEventsSpeakers1732810000000 implements MigrationInterface {
  name = 'AddProfileColumnsToEventsSpeakers1732810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events_speakers"
      ADD COLUMN IF NOT EXISTS "photo" varchar(255),
      ADD COLUMN IF NOT EXISTS "bio" text,
      ADD COLUMN IF NOT EXISTS "company_name" varchar(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events_speakers"
      DROP COLUMN IF EXISTS "photo",
      DROP COLUMN IF EXISTS "bio",
      DROP COLUMN IF EXISTS "company_name"
    `);
  }
}
