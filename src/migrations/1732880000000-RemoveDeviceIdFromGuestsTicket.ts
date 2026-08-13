import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * REVERT dari migration 1732870000000 — kolom `device_id` di `guests_ticket`
 * ternyata bakal KE-OVERWRITE tiap kali sync MySQL->Postgres jalan (karena
 * `guests_ticket` adalah tabel yang di-refresh periodik dari sumber MySQL
 * yang gak punya kolom ini). FCM device ID sekarang disimpan di
 * `visitor_device_token` (tabel independen, gak disentuh sync sama sekali)
 * lewat PushNotificationsService — lihat migration 1732850000000.
 */
export class RemoveDeviceIdFromGuestsTicket1732880000000 implements MigrationInterface {
  name = 'RemoveDeviceIdFromGuestsTicket1732880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "guests_ticket"
      DROP COLUMN IF EXISTS "device_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "guests_ticket"
      ADD COLUMN IF NOT EXISTS "device_id" varchar(255)
    `);
  }
}
