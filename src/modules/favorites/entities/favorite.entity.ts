import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Favorite COMPANY -> companyId diisi, productId NULL.
 * Favorite PRODUCT -> companyId diisi (company pemilik produk), productId
 * diisi. WAJIB pasangan companyId+productId (bukan productId doang) karena
 * product_id gak unik lintas company (reset per company).
 */
@Entity('visitor_favorite')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'guests_id', type: 'int' })
  guestsId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
