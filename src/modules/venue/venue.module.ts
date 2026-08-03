import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenueSpace } from './entities/venue-space.entity';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';

@Module({
  imports: [TypeOrmModule.forFeature([VenueSpace])],
  controllers: [VenueController],
  providers: [VenueService],
  exports: [TypeOrmModule],
})
export class VenueModule {}
