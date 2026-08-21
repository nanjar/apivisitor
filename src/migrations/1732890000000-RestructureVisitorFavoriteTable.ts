import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rombak struktur `visitor_favorite` dari pola polymorphic (target_type +
 * target_id generik) jadi company_id + product_id eksplisit.
 *
 * Alasan: `product_id` di `exhibitor_product` TIDAK unik lintas company
 * (reset per company — bug class yang sama kayak yang pernah ketemu di
 * filter product type). Desain awal (target_type='PRODUCT', target_id=X)
 * gak cukup buat identifikasi produk yang bener — butuh company_id juga.
 *
 * Aturan baru:
 *   - Favorite COMPANY -> company_id diisi, product_id NULL
 *   - Favorite PRODUCT -> company_id diisi (company pemilik produk),
 *     product_id diisi (product_id SELALU butuh company_id pasangannya)
 *
 * CATATAN: migration ini TRUNCATE data lama di visitor_favorite (kolom
 * target_type/target_id gak punya cukup info buat di-backfill ke
 * company_id/product_id secara otomatis — product favorite lama gak
 * nyimpen company_id-nya). Fitur ini baru aja diluncurkan jadi dampaknya
 * minim, tapi kalau ternyata udah ada data produksi yang penting, JANGAN
 * jalanin migration ini dulu, kabari saya.
 */
export class RestructureVisitorFavoriteTable1732890000000 implements MigrationInterface {
  name = 'RestructureVisitorFavoriteTable1732890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE "visitor_favorite"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_visitor_favorite_target"`);
    await queryRunner.query(`
      ALTER TABLE "visitor_favorite"
      DROP COLUMN IF EXISTS "target_type",
      DROP COLUMN IF EXISTS "target_id",
      ADD COLUMN "company_id" int NOT NULL,
      ADD COLUMN "product_id" int
    `);
    // Unique pakai COALESCE biar company-favorite (product_id NULL) juga
    // ke-enforce unik — Postgres default nganggep NULL selalu "beda" di
    // unique index biasa, jadi perlu expression index buat nutup celah itu.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_visitor_favorite_target"
      ON "visitor_favorite" ("events_id", "guests_id", "company_id", COALESCE("product_id", 0))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_visitor_favorite_target"`);
    await queryRunner.query(`
      ALTER TABLE "visitor_favorite"
      DROP COLUMN IF EXISTS "company_id",
      DROP COLUMN IF EXISTS "product_id",
      ADD COLUMN "target_type" varchar(10) NOT NULL DEFAULT 'COMPANY',
      ADD COLUMN "target_id" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_visitor_favorite_target"
      ON "visitor_favorite" ("events_id", "guests_id", "target_type", "target_id")
    `);
  }
}
