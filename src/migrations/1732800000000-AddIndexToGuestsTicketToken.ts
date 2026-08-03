import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Login visitor app pakai kolom `token` yang sudah ada di skema asli
 * (digenerate sistem tiketing saat visitor beli tiket). Tidak perlu
 * kolom baru — cukup index supaya lookup token saat login cepat.
 */
export class AddIndexToGuestsTicketToken1732800000000 implements MigrationInterface {
  name = 'AddIndexToGuestsTicketToken1732800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_guests_ticket_token"
      ON "guests_ticket" ("token")
      WHERE "token" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_guests_ticket_token"`);
  }
}
