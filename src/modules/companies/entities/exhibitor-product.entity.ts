import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('exhibitor_product')
export class ExhibitorProduct {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'company_id', type: 'int' })
  companyId: number;

  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName: string;

  @Column({ name: 'product_logo', type: 'varchar', length: 255, nullable: true })
  productLogo: string | null;

  @Column({ name: 'product_description', type: 'text', nullable: true })
  productDescription: string | null;

  @Column({ name: 'investment_fee', type: 'numeric', nullable: true })
  investmentFee: string | null;

  @Column({ name: 'brochure', type: 'varchar', length: 255, nullable: true })
  brochure: string | null;

  @Column({ name: 'approval_status', type: 'varchar', length: 2, default: 'AP' })
  approvalStatus: string;

  @Column({ name: 'created', type: 'timestamptz' })
  created: Date;
}
