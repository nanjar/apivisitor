import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabel native (BUKAN hasil sync) - log setiap klik visitor ke link
 * sosial media/website/brosur di halaman Company Detail atau Product
 * Detail. Dibaca langsung oleh apiexhibitor (shared Postgres DB) untuk
 * ditampilkan di Reports - tidak perlu sync ke MySQL sama sekali,
 * murni data analitik.
 */
export class CreateLinkClickLogTable1733030000000
  implements MigrationInterface
{
  name = 'CreateLinkClickLogTable1733030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "link_click_log" (
        "id" SERIAL PRIMARY KEY,
        "events_id" int NOT NULL,
        "company_id" int NOT NULL,
        "product_id" int,
        "guests_id" int,
        "link_type" varchar(20) NOT NULL,
        "clicked_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_link_click_log_company"
      ON "link_click_log" ("events_id", "company_id", "clicked_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_link_click_log_product"
      ON "link_click_log" ("events_id", "product_id")
      WHERE "product_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "link_click_log"`);
  }
}
