import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { OllamaService, OllamaUnavailableError } from '../ai/ollama.service';

interface AiRecommendationItem {
  companyId: number;
  reason: string;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(GuestTicket) private readonly guestTicketRepo: Repository<GuestTicket>,
    @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(CheckinBooth) private readonly checkinRepo: Repository<CheckinBooth>,
    private readonly ollama: OllamaService,
  ) {}

  // Screen: AI Exhibitor Recommendation
  async getRecommendations(eventsId: number, guestsId: number) {
    const [guest, visitedCompanyIds, favoriteCompanyIds, candidates] = await Promise.all([
      this.guestTicketRepo.findOne({ where: { eventsId, guestsId } }),
      this.getVisitedCompanyIds(eventsId, guestsId),
      this.getFavoriteCompanyIds(eventsId, guestsId),
      this.companyRepo.find({ where: { eventsId, approvalStatus: 'AP' }, take: 40 }),
    ]);

    // Exclude yang udah dikunjungi/di-favorite — rekomendasi buat yang BELUM dieksplor
    const excludeIds = new Set([...visitedCompanyIds, ...favoriteCompanyIds]);
    const pool = candidates.filter((c) => !excludeIds.has(c.id));

    if (!pool.length) {
      return { items: [], source: 'none' as const };
    }

    try {
      const aiResult = await this.getAiRanked(guest, pool);
      if (aiResult.length) {
        return { items: aiResult, source: 'ai' as const };
      }
    } catch (err) {
      this.logger.warn(
        `AI recommendation gagal, fallback ke heuristik: ${err instanceof Error ? err.message : err}`,
      );
    }

    return { items: this.getHeuristicRanked(pool), source: 'heuristic' as const };
  }

  private async getAiRanked(guest: GuestTicket | null, pool: ExhibitorCompany[]) {
    const shortlist = pool.slice(0, 20); // batasi biar prompt gak kepanjangan buat model 8B

    const profileLine = guest?.companyName
      ? `Visitor bekerja/mewakili perusahaan: ${guest.companyName}.`
      : 'Profil perusahaan visitor tidak diketahui.';

    const companyList = shortlist
      .map((c) => `${c.id}. ${c.companyName}${c.details ? ` - ${c.details.slice(0, 100)}` : ''}`)
      .join('\n');

    try {
      const result = await this.ollama.generateJson<{ recommendations: AiRecommendationItem[] }>(
        `Kamu adalah sistem rekomendasi exhibitor untuk aplikasi visitor pameran bisnis.
${profileLine}
Dari daftar exhibitor berikut, pilih maksimal 5 yang paling relevan buat dikunjungi visitor ini,
urutkan dari paling relevan. Kalau profil visitor tidak diketahui, pilih exhibitor yang paling
menarik secara umum (deskripsi paling informatif).
Format output: {"recommendations": [{"companyId": 1, "reason": "alasan singkat 1 kalimat"}]}`,
        `Daftar exhibitor (format "id. nama - deskripsi"):\n${companyList}`,
      );

      if (!Array.isArray(result.recommendations)) return [];

      const companyById = new Map(shortlist.map((c) => [c.id, c]));
      return result.recommendations
        .filter((r) => companyById.has(r.companyId))
        .slice(0, 5)
        .map((r) => {
          const c = companyById.get(r.companyId)!;
          return {
            id: c.id,
            companyName: c.companyName,
            logo: c.logo,
            reason: typeof r.reason === 'string' ? r.reason.slice(0, 200) : null,
          };
        });
    } catch (err) {
      if (err instanceof OllamaUnavailableError) throw err;
      throw new OllamaUnavailableError(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Fallback kalau Ollama unreachable/gagal parse: rekomendasi berbasis
   * "paling baru diupdate" (proxy sederhana buat "exhibitor aktif/relevan"
   * tanpa AI). Bukan personalisasi, tapi tetap kasih hasil yang masuk akal
   * daripada endpoint gagal total.
   */
  private getHeuristicRanked(pool: ExhibitorCompany[]) {
    return pool
      .slice()
      .sort((a, b) => (b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0))
      .slice(0, 5)
      .map((c) => ({ id: c.id, companyName: c.companyName, logo: c.logo, reason: null }));
  }

  private async getVisitedCompanyIds(eventsId: number, guestsId: number): Promise<number[]> {
    const rows = await this.checkinRepo
      .createQueryBuilder('c')
      .select('DISTINCT c.companyId', 'companyId')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.guestsId = :guestsId', { guestsId })
      .getRawMany<{ companyId: number }>();
    return rows.map((r) => r.companyId);
  }

  private async getFavoriteCompanyIds(eventsId: number, guestsId: number): Promise<number[]> {
    const favorites = await this.favoriteRepo.find({
      where: { eventsId, guestsId, productId: IsNull() },
    });
    return favorites.map((f) => f.companyId);
  }
}
