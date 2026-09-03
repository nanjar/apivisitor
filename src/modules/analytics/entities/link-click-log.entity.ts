import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Native (bukan mirror) - log klik visitor ke link sosmed/website/brosur
 * di Company Detail atau Product Detail. Dibaca langsung oleh
 * apiexhibitor untuk Reports (shared Postgres DB, tidak sync ke MySQL). */
@Entity('link_click_log')
export class LinkClickLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number | null;

  @Column({ name: 'guests_id', type: 'int', nullable: true })
  guestsId: number | null;

  @Column({ name: 'link_type', type: 'varchar', length: 20 })
  linkType:
    | 'INSTAGRAM'
    | 'FACEBOOK'
    | 'TIKTOK'
    | 'TWITTER'
    | 'WEBSITE'
    | 'BROCHURE'
    | 'PROMO';

  @Column({ name: 'clicked_at', type: 'timestamptz' })
  clickedAt: Date;

  @Column({ name: 'pushed_at', type: 'timestamptz', nullable: true })
  pushedAt: Date | null;
}
