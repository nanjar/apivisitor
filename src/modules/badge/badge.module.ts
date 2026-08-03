import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';

@Module({
  imports: [TypeOrmModule.forFeature([GuestTicket, CheckinBooth, ExhibitorCompany])],
  controllers: [BadgeController],
  providers: [BadgeService],
})
export class BadgeModule {}
