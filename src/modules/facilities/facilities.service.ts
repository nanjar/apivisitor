import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';

@Injectable()
export class FacilitiesService {
  constructor(@InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>) {}

  // Screen: Facilities
  async list(eventsId: number) {
    return this.facilityRepo.find({
      where: { eventsId },
      order: { sortNo: 'ASC' },
    });
  }
}
