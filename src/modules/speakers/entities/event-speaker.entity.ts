import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Skema asli `events_speakers` tidak punya kolom foto/bio/company/social
 * links — padahal Speaker Detail screen butuh itu semua. Kolom tambahan
 * di bawah (photo, bio, company_name) ditambahkan via migration
 * `1732810000000-AddProfileColumnsToEventsSpeakers`.
 */
@Entity('events_speakers')
export class EventSpeaker {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'speaker_id', type: 'int' })
  speakerId: number;

  @Column({ name: 'speaker_name', type: 'varchar', length: 200 })
  speakerName: string;

  @Column({ name: 'speaker_email', type: 'varchar', length: 100, nullable: true })
  speakerEmail: string | null;

  @Column({ name: 'speaker_phone', type: 'varchar', length: 30, nullable: true })
  speakerPhone: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 200, nullable: true })
  jobTitle: string | null;

  @Column({ name: 'approval_status', type: 'varchar', length: 2, nullable: true })
  approvalStatus: string | null;

  // --- kolom tambahan hasil migration ---
  @Column({ name: 'photo', type: 'varchar', length: 255, nullable: true })
  photo: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'company_name', type: 'varchar', length: 200, nullable: true })
  companyName: string | null;
}
