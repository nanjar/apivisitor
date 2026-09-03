import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('events_meeting_v2')
export class EventMeeting {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'meeting_title', type: 'varchar', length: 45, nullable: true })
  meetingTitle: string | null;

  @Column({ name: 'start_datetime', type: 'timestamptz', nullable: true })
  startDatetime: Date | null;

  @Column({ name: 'end_datetime', type: 'timestamptz', nullable: true })
  endDatetime: Date | null;

  @Column({ name: 'notes', type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  // PE: Pending, AP: Approved/Confirmed, CL: Cancelled, RJ: Rejected, CO: Completed
  @Column({ name: 'approval_status', type: 'varchar', length: 2 })
  approvalStatus: string;

  @Column({ name: 'venue_id', type: 'int', default: 0 })
  venueId: number;

  @Column({ name: 'space_id', type: 'int', default: 0 })
  spaceId: number;

  @Column({ name: 'Status', type: 'varchar', length: 10, default: 'OPEN' })
  status: string;

  @Column({ name: 'initiated_by', type: 'varchar', length: 2, nullable: true })
  initiatedBy: 'VI' | 'EX' | null;

  @Column({ name: 'initiator_id', type: 'int', nullable: true })
  initiatorId: number | null;

  @Column({ name: 'com_direction', type: 'varchar', length: 3, nullable: true })
  comDirection: string | null; // e.g. 'V2E' visitor->exhibitor, 'E2V' exhibitor->visitor

  @Column({ name: 'is_done', type: 'varchar', length: 1, default: 'N' })
  isDone: string;

  @Column({ name: 'agenda_id', type: 'int', nullable: true })
  agendaId: number | null;

  @Column({ name: 'meeting_timeslot', type: 'time', nullable: true })
  meetingTimeslot: string | null;

  @Column({ name: 'meeting_location', type: 'int', nullable: true })
  meetingLocation: number | null;

  @Column({ name: 'meeting_score', type: 'varchar', length: 10, nullable: true })
  meetingScore: string | null;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId: number | null;
}
