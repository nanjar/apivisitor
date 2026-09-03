import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * member_guests_id = guests_ticket.id (BUKAN ticket_id) - dikonfirmasi
 * Sept 2026: satu guest bisa punya banyak tiket (token beda-beda), field
 * ini yang bedain baris tiket spesifik. Dibutuhkan karena tabel legacy
 * MySQL (instagram_clicked_v2 dkk) pakai ini sebagai bagian primary key.
 */
export class AddMemberGuestsIdToLinkClickLog1733050000000
  implements MigrationInterface
{
  name = 'AddMemberGuestsIdToLinkClickLog1733050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "link_click_log"
      ADD COLUMN IF NOT EXISTS "member_guests_id" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "link_click_log" DROP COLUMN IF EXISTS "member_guests_id"
    `);
  }
}
