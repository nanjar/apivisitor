import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Tabel legacy bernama `exhibitor` (bukan exhibitor_company) — ini adalah
 * data STAFF/PIC dari sebuah company, bukan data company itu sendiri.
 * `in_charge` = 'Y' menandakan PIC utama yang ditampilkan di Company Detail.
 */
@Entity('exhibitor_contact')
export class Exhibitor {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'fullname', type: 'varchar', length: 100 })
  fullname: string;

  @Column({ name: 'job_title', type: 'varchar', length: 100, nullable: true })
  jobTitle: string | null;

  @Column({ name: 'country_code', type: 'varchar', length: 12, nullable: true })
  countryCode: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId: number | null;

  @Column({ name: 'approval_status', type: 'varchar', length: 2, default: 'PS' })
  approvalStatus: string;

  @Column({ name: 'user_level', type: 'varchar', length: 3, default: 'OPR' })
  userLevel: 'ADM' | 'OPR';

  @Column({ name: 'in_charge', type: 'varchar', length: 1, default: 'N' })
  inCharge: string;

  @Column({ name: 'exhibitor_email', type: 'varchar', length: 250, nullable: true })
  exhibitorEmail: string | null;
}
