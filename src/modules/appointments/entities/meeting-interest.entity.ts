import { Entity, PrimaryColumn } from 'typeorm';

@Entity('meeting_interest')
export class MeetingInterest {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'meeting_id', type: 'int' })
  meetingId: number;

  @PrimaryColumn({ name: 'interest_id', type: 'int' })
  interestId: number;
}
