import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { Session } from '../schedule/entities/session.entity';
import { Agenda } from '../schedule/entities/agenda.entity';
import { EventSpeaker } from '../speakers/entities/event-speaker.entity';
import { OllamaService, OllamaUnavailableError } from '../ai/ollama.service';

interface ParsedQuery {
  entityTypes: Array<'companies' | 'products' | 'sessions' | 'speakers'>;
  keywords: string[];
}

const ALL_ENTITY_TYPES: ParsedQuery['entityTypes'] = ['companies', 'products', 'sessions', 'speakers'];

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Agenda) private readonly agendaRepo: Repository<Agenda>,
    @InjectRepository(EventSpeaker) private readonly speakerRepo: Repository<EventSpeaker>,
    private readonly ollama: OllamaService,
  ) {}

  // Screen: Universal Search
  async search(eventsId: number, rawQuery: string) {
    const parsed = await this.parseQuery(rawQuery);

    const [companies, products, sessions, speakers] = await Promise.all([
      parsed.entityTypes.includes('companies')
        ? this.searchCompanies(eventsId, parsed.keywords)
        : Promise.resolve([]),
      parsed.entityTypes.includes('products')
        ? this.searchProducts(eventsId, parsed.keywords)
        : Promise.resolve([]),
      parsed.entityTypes.includes('sessions')
        ? this.searchSessions(eventsId, parsed.keywords)
        : Promise.resolve([]),
      parsed.entityTypes.includes('speakers')
        ? this.searchSpeakers(eventsId, parsed.keywords)
        : Promise.resolve([]),
    ]);

    return {
      interpretedKeywords: parsed.keywords,
      companies,
      products,
      sessions,
      speakers,
    };
  }

  /**
   * Minta Ollama ekstrak entity type + keyword dari query bahasa natural
   * visitor (mis. "cari perusahaan makanan di hall A" -> entityTypes:
   * ['companies'], keywords: ['makanan']). Kalau Ollama gak bisa dihubungi
   * atau balikin format aneh, fallback: search SEMUA entity type pakai
   * raw query apa adanya sebagai keyword — visitor tetap dapat hasil,
   * cuma kurang "pintar" filternya.
   */
  private async parseQuery(rawQuery: string): Promise<ParsedQuery> {
    try {
      const result = await this.ollama.generateJson<Partial<ParsedQuery>>(
        `Kamu adalah parser query untuk aplikasi pameran (exhibition). Tugasmu: dari kalimat pencarian
pengguna, tentukan (1) jenis data apa yang dicari — bisa lebih dari satu dari:
"companies" (perusahaan/exhibitor), "products" (produk), "sessions" (sesi/acara di jadwal),
"speakers" (pembicara) — dan (2) kata kunci inti (bukan kata umum seperti "cari", "yang", "di").
Kalau tidak yakin jenis datanya, sertakan semua jenis.
Format output: {"entityTypes": ["companies"], "keywords": ["kata1", "kata2"]}`,
        rawQuery,
      );

      const entityTypes = Array.isArray(result.entityTypes)
        ? result.entityTypes.filter((t): t is ParsedQuery['entityTypes'][number] =>
            ALL_ENTITY_TYPES.includes(t as any),
          )
        : [];
      const keywords = Array.isArray(result.keywords)
        ? result.keywords.filter((k) => typeof k === 'string' && k.trim())
        : [];

      return {
        entityTypes: entityTypes.length ? entityTypes : ALL_ENTITY_TYPES,
        keywords: keywords.length ? keywords : [rawQuery],
      };
    } catch (err) {
      if (err instanceof OllamaUnavailableError) {
        this.logger.warn(`Ollama unavailable, fallback ke plain keyword search: ${err.message}`);
      } else {
        this.logger.warn(`parseQuery error, fallback ke plain keyword search: ${err}`);
      }
      return { entityTypes: ALL_ENTITY_TYPES, keywords: [rawQuery] };
    }
  }

  private async searchCompanies(eventsId: number, keywords: string[]) {
    const qb = this.companyRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.approvalStatus = :status', { status: 'AP' })
      .andWhere(this.buildKeywordClause('c.companyName', keywords), this.buildKeywordParams(keywords))
      .take(10);
    const items = await qb.getMany();
    return items.map((c) => ({ id: c.id, companyName: c.companyName, logo: c.logo }));
  }

  private async searchProducts(eventsId: number, keywords: string[]) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.eventsId = :eventsId', { eventsId })
      .andWhere('p.approvalStatus = :status', { status: 'AP' })
      .andWhere(this.buildKeywordClause('p.productName', keywords), this.buildKeywordParams(keywords))
      .take(10);
    const items = await qb.getMany();
    return items.map((p) => ({ id: p.id, companyId: p.companyId, productName: p.productName, productLogo: p.productLogo }));
  }

  private async searchSessions(eventsId: number, keywords: string[]) {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.eventsId = :eventsId', { eventsId })
      .andWhere(this.buildKeywordClause('s.sessionTopic', keywords), this.buildKeywordParams(keywords))
      .take(10);
    const items = await qb.getMany();

    const agendaIds = [...new Set(items.map((s) => s.agendaId))];
    const agendas = agendaIds.length
      ? await this.agendaRepo
          .createQueryBuilder('a')
          .where('a.eventsId = :eventsId', { eventsId })
          .andWhere('a.id IN (:...ids)', { ids: agendaIds })
          .getMany()
      : [];
    const agendaMap = new Map(agendas.map((a) => [a.id, a]));

    return items.map((s) => {
      const agenda = agendaMap.get(s.agendaId);
      return {
        sessionId: s.id,
        trackId: s.trackId,
        agendaId: s.agendaId,
        topic: s.sessionTopic,
        startTime: s.startTime,
        endTime: s.endTime,
        dayLabel: agenda?.aliasName ?? agenda?.agendaName ?? null,
      };
    });
  }

  private async searchSpeakers(eventsId: number, keywords: string[]) {
    const qb = this.speakerRepo
      .createQueryBuilder('sp')
      .where('sp.eventsId = :eventsId', { eventsId })
      .andWhere(this.buildKeywordClause('sp.speakerName', keywords), this.buildKeywordParams(keywords))
      .take(10);
    const items = await qb.getMany();
    return items.map((sp) => ({ speakerId: sp.speakerId, name: sp.speakerName, photo: sp.photo }));
  }

  private buildKeywordClause(column: string, keywords: string[]): string {
    // PENTING: HARUS dibungkus kurung! Tanpa ini, `AND eventsId=X AND kw0 OR
    // kw1 OR kw2` ke-parse SQL jadi `(eventsId=X AND kw0) OR kw1 OR kw2`
    // (AND lebih erat dari OR) — filter eventsId cuma nempel ke keyword
    // pertama, keyword lain bocor nyari ke SEMUA event. Bug nyata yang
    // ketemu 4 Aug 2026 dari testing production (search leak data lintas
    // event pas query di-parse jadi >1 keyword oleh Ollama).
    return `(${keywords.map((_, i) => `${column} ILIKE :kw${i}`).join(' OR ')})`;
  }

  private buildKeywordParams(keywords: string[]): Record<string, string> {
    return Object.fromEntries(keywords.map((kw, i) => [`kw${i}`, `%${kw}%`]));
  }
}
