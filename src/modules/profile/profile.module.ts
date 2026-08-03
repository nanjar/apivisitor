import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([GuestTicket])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
