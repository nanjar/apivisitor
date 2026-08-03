import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExhCompanySpace } from '../venue/entities/exh-company-space.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { LocationAddress } from '../venue/entities/location-address.entity';

export interface BoothLocation {
  venueName: string | null;
  hallLabel: string | null;
  boothLabel: string | null;
}

const EMPTY_LOCATION: BoothLocation = { venueName: null, hallLabel: null, boothLabel: null };

/**
 * Resolve lokasi booth RESMI 1/banyak company sekaligus (batch-friendly,
 * hindari N+1). Sumbernya:
 *   - exhcompany_space  -> venue_id + space_id resmi milik company
 *   - venue_space       -> nama booth (space_name) & detail (space_details)
 *   - location_address  -> nama venue (ev_venue)
 *
 * CATATAN: sebelumnya sempat pakai `checkin_booth` (riwayat scan visitor)
 * buat nebak lokasi booth company — itu salah secara konsep, karena
 * checkin_booth itu histori KUNJUNGAN, bukan data assignment booth resmi.
 * Diperbaiki 31 Jul 2026 atas koreksi langsung dari tim.
 */
@Injectable()
export class BoothResolverService {
  private readonly logger = new Logger(BoothResolverService.name);

  constructor(
    @InjectRepository(ExhCompanySpace)
    private readonly exhCompanySpaceRepo: Repository<ExhCompanySpace>,
    @InjectRepository(VenueSpace) private readonly venueSpaceRepo: Repository<VenueSpace>,
    @InjectRepository(LocationAddress)
    private readonly locationAddressRepo: Repository<LocationAddress>,
  ) {}

  async resolveOne(eventsId: number, companyId: number): Promise<BoothLocation> {
    const map = await this.resolveMany(eventsId, [companyId]);
    return map.get(companyId) ?? EMPTY_LOCATION;
  }

  async resolveMany(eventsId: number, companyIds: number[]): Promise<Map<number, BoothLocation>> {
    const result = new Map<number, BoothLocation>();
    if (!companyIds.length) return result;

    // Defensive: kalau tabel `exhcompany_space`/`location_address` belum
    // ke-sync dari MySQL ke Postgres (sempat kejadian nyata 31 Jul 2026),
    // jangan biarin ini nge-crash seluruh Home/Explore/Company Detail —
    // cukup log warning & balikin map kosong (semua field jadi null di
    // response), fitur lain tetap jalan normal.
    let links: ExhCompanySpace[];
    try {
      links = await this.exhCompanySpaceRepo.find({
        where: { eventsId, companyId: In(companyIds) },
      });
    } catch (err) {
      this.logger.warn(
        `Gagal query exhcompany_space (tabel belum ke-sync?), venueName/hallLabel/boothLabel akan null: ${err instanceof Error ? err.message : err}`,
      );
      return result;
    }
    if (!links.length) return result;

    // 1 company secara teknis bisa punya >1 baris assignment booth di data
    // real — ambil baris pertama sebagai representasi utama per company.
    const linkByCompany = new Map<number, ExhCompanySpace>();
    for (const link of links) {
      if (!linkByCompany.has(link.companyId)) {
        linkByCompany.set(link.companyId, link);
      }
    }

    const venueIds = [...new Set([...linkByCompany.values()].map((l) => l.venueId))];

    let spaces: VenueSpace[] = [];
    let venues: LocationAddress[] = [];
    try {
      [spaces, venues] = await Promise.all([
        this.venueSpaceRepo.find({ where: { eventsId } }),
        this.locationAddressRepo.find({ where: { eventsId, venueId: In(venueIds) } }),
      ]);
    } catch (err) {
      this.logger.warn(
        `Gagal query venue_space/location_address, venueName akan null: ${err instanceof Error ? err.message : err}`,
      );
    }

    const spaceMap = new Map(spaces.map((s) => [`${s.venueId}-${s.id}`, s]));
    const venueMap = new Map(venues.map((v) => [v.venueId, v]));

    for (const [companyId, link] of linkByCompany) {
      const space = spaceMap.get(`${link.venueId}-${link.spaceId}`);
      const venue = venueMap.get(link.venueId);
      result.set(companyId, {
        venueName: venue?.venueName || null,
        hallLabel: space?.spaceName ?? null,
        boothLabel: space?.spaceDetails ?? null,
      });
    }
    return result;
  }
}
