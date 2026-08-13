import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Kolom device_id buat kebutuhan Firebase FCM — disimpan langsung di
 * guests_ticket (bukan tabel terpisah), sesuai keputusan: 1 device aktif
 * per guest, di-overwrite tiap kali visitor buka Home Dashboard (bukan
 * multi-device seperti `visitor_device_token`).
 */
export class AddDeviceIdToGuestsTicket1732870000000 implements MigrationInterface {
  name = 'AddDeviceIdToGuestsTicket1732870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "guests_ticket"
      ADD COLUMN IF NOT EXISTS "device_id" varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "guests_ticket"
      DROP COLUMN IF EXISTS "device_id"
    `);
  }
}
