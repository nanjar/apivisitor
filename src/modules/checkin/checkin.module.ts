import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { ExhCompanySpace } from '../venue/entities/exh-company-space.entity';
import { LocationAddress } from '../venue/entities/location-address.entity';
import { BoothResolverService } from './booth-resolver.service';

@Module({
  imports: [TypeOrmModule.forFeature([VenueSpace, ExhCompanySpace, LocationAddress])],
  providers: [BoothResolverService],
  exports: [BoothResolverService],
})
export class CheckinModule {}
