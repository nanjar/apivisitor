import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fitur "Reschedule meeting" (Sept 2026) - PRD asli minta "Ajukan meeting
 * baru" (exhibitor inisiasi meeting baru ke visitor), diputuskan diganti
 * jadi reschedule (ubah jadwal meeting yang SUDAH approved) - lebih
 * sesuai kebutuhan nyata, exhibitor gak perlu alur create-meeting baru
 * yang jauh lebih kompleks (perlu pilih visitor, cek ketersediaan slot, dst).
 */
export class AddRescheduleFieldsToExhibitorMeetingAction1733060000000
  implements MigrationInterface
{
  name = 'AddRescheduleFieldsToExhibitorMeetingAction1733060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action"
      ADD COLUMN IF NOT EXISTS "new_start_datetime" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action"
      ADD COLUMN IF NOT EXISTS "new_end_datetime" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action" DROP COLUMN IF EXISTS "new_end_datetime"
    `);
    await queryRunner.query(`
      ALTER TABLE "exhibitor_app_meeting_action" DROP COLUMN IF EXISTS "new_start_datetime"
    `);
  }
}
