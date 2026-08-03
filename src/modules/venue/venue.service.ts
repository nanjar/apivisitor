import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueSpace } from './entities/venue-space.entity';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(VenueSpace) private readonly venueSpaceRepo: Repository<VenueSpace>,
  ) {}

  // Screen: Interactive Floor Map
  // CATATAN GAP: venue_space tidak punya kolom koordinat (x, y) untuk hotspot
  // di gambar denah, dan tidak ada tabel `venue` terpisah untuk gambar denah
  // (floor plan image) itu sendiri — yang ada cuma `logo` per space (kemungkinan
  // foto booth, bukan denah). Endpoint ini baru bisa kasih daftar booth per
  // venue_id; rendering "interactive" (pin di atas denah) butuh skema tambahan:
  //   - tabel venue (id, events_id, floor_plan_image, floor_width, floor_height)
  //   - kolom pos_x, pos_y (persentase atau pixel) di venue_space
  async getFloorMap(eventsId: number) {
    const spaces = await this.venueSpaceRepo.find({
      where: { eventsId },
      order: { venueId: 'ASC', id: 'ASC' },
    });

    const grouped = new Map<number, typeof spaces>();
    for (const space of spaces) {
      if (!grouped.has(space.venueId)) grouped.set(space.venueId, []);
      grouped.get(space.venueId)!.push(space);
    }

    return Array.from(grouped.entries()).map(([venueId, list]) => ({
      venueId,
      booths: list
        .filter((s) => s.spaceType === 'BO')
        .map((s) => ({
          spaceId: s.id,
          boothCode: s.spaceName,
          details: s.spaceDetails,
          logo: s.logo,
          // posX / posY: TODO setelah skema koordinat tersedia
        })),
    }));
  }
}
