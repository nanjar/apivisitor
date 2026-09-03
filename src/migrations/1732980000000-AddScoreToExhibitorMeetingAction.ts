import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tambah kolom score ke exhibitor_app_meeting_action - dikonfirmasi
 * Sept 2026: temperature Hot/Warm/Cold lead itu SAMA DENGAN
 * events_meeting_v2.meeting_score, diisi exhibitor saat approve meeting
 * (bukan field terpisah untuk lead). Approve endpoint sekarang WAJIB
 * kirim score.
 */
export class AddScoreToExhibitorMeetingAction1732980000000
  implements MigrationInterface
{
  name = 'AddScoreToExhibitorMeetingAction1732980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action"
      ADD COLUMN IF NOT EXISTS "score" varchar(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action"
      DROP COLUMN IF EXISTS "score"
    `);
  }
}
