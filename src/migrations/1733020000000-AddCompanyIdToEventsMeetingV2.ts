import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix gap kritis (Sept 2026): AppointmentsService.create() TIDAK PERNAH
 * insert ke meeting_member_v2 (dicek nol referensi di seluruh codebase) -
 * meeting baru hasil booking visitor app gak pernah kelihatan di
 * exhibitor app karena Meeting module di sana bergantung pada
 * meeting_member_v2 buat tahu company pemilik meeting.
 *
 * Fix: company_id sekarang kolom langsung di events_meeting_v2, diisi
 * AppointmentsService.create() saat booking baru. Data lama (booking
 * sebelum fix ini) di-backfill manual dari meeting_member_v2 lewat
 * script SQL terpisah (alter-events_meeting_v2-add-company_id.sql).
 */
export class AddCompanyIdToEventsMeetingV21733020000000
  implements MigrationInterface
{
  name = 'AddCompanyIdToEventsMeetingV21733020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events_meeting_v2"
      ADD COLUMN IF NOT EXISTS "company_id" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events_meeting_v2" DROP COLUMN IF EXISTS "company_id"
    `);
  }
}
