import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { ExhibitorProductHasType } from '../companies/entities/exhibitor-product-has-type.entity';
import { VisitorCompanyViewLog } from './entities/visitor-company-view-log.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { BoothResolverService } from '../checkin/booth-resolver.service';
import { ProductTypeResolverService } from '../product-types/product-type-resolver.service';
import { ExploreQueryDto } from './dto/explore-query.dto';

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

  constructor(
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
    @InjectRepository(VisitorCompanyViewLog)
    private readonly viewLogRepo: Repository<VisitorCompanyViewLog>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    private readonly boothResolver: BoothResolverService,
    private readonly productTypeResolver: ProductTypeResolverService,
  ) {}

  async search(eventsId: number, guestsId: number, query: ExploreQueryDto) {
    if (query.tab === 'products') {
      return this.searchProducts(eventsId, query);
    }
    if (query.tab === 'categories') {
      // Belum ada tabel kategori/industri exhibitor di skema yang dikirim.
      // Endpoint tetap disediakan agar kontrak API stabil untuk FE, tapi
      // hasilnya kosong sampai tabel kategori tersedia.
      return { tab: 'categories', items: [], total: 0, page: query.page, limit: query.limit };
    }
    return this.searchCompanies(eventsId, guestsId, query);
  }

  // Batch-friendly: ambil set company_id yang di-favorite visitor ini
  // (company favorite = product_id NULL) buat nandain isFavorited tanpa N+1.
  private async getFavoritedCompanyIds(
    eventsId: number,
    guestsId: number,
    companyIds: number[],
  ): Promise<Set<number>> {
    if (!companyIds.length) return new Set();
    const favorites = await this.favoriteRepo.find({
      where: { eventsId, guestsId, companyId: In(companyIds), productId: IsNull() },
    });
    return new Set(favorites.map((f) => f.companyId));
  }

  private async searchCompanies(eventsId: number, guestsId: number, query: ExploreQueryDto) {
    // Filter investment: company harus punya minimal 1 produk dengan
    // investment_fee di rentang yang diminta. Query terpisah dulu buat
    // dapetin daftar company_id yang match, baru dipakai buat filter utama
    // (lebih murah/simpel daripada JOIN + DISTINCT di query utama).
    let investmentFilteredIds: number[] | null = null;
    if (query.minInvestment !== undefined || query.maxInvestment !== undefined) {
      const productQb = this.productRepo
        .createQueryBuilder('p')
        .select('DISTINCT p.companyId', 'companyId')
        .where('p.eventsId = :eventsId', { eventsId })
        .andWhere('p.approvalStatus = :status', { status: 'AP' });
      if (query.minInvestment !== undefined) {
        productQb.andWhere('p.investmentFee >= :minInv', { minInv: query.minInvestment });
      }
      if (query.maxInvestment !== undefined) {
        productQb.andWhere('p.investmentFee <= :maxInv', { maxInv: query.maxInvestment });
      }
      const rows = await productQb.getRawMany<{ companyId: number }>();
      investmentFilteredIds = rows.map((r) => r.companyId);

      // Gak ada company yang match filter investment -> gak perlu query lagi
      if (investmentFilteredIds.length === 0) {
        return { tab: 'companies', items: [], total: 0, page: query.page, limit: query.limit };
      }
    }

    const qb = this.companyRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.approvalStatus = :status', { status: 'AP' });

    if (query.keyword) {
      qb.andWhere('c.companyName ILIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.country) {
      qb.andWhere('c.country = :country', { country: query.country });
    }
    if (investmentFilteredIds) {
      qb.andWhere('c.id IN (:...ids)', { ids: investmentFilteredIds });
    }

    const [items, total] = await qb
      .orderBy('c.companyName', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const boothMap = await this.boothResolver.resolveMany(eventsId, items.map((c) => c.id));
    const favoritedIds = await this.getFavoritedCompanyIds(eventsId, guestsId, items.map((c) => c.id));

    return {
      tab: 'companies',
      items: items.map((c) => {
        const booth = boothMap.get(c.id);
        return {
          id: c.id,
          companyName: c.companyName,
          logo: c.logo,
          country: c.country,
          venueName: booth?.venueName ?? null,
          hallLabel: booth?.hallLabel ?? null,
          boothLabel: booth?.boothLabel ?? null,
          isFavorited: favoritedIds.has(c.id),
        };
      }),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private async searchProducts(eventsId: number, query: ExploreQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.eventsId = :eventsId', { eventsId })
      .andWhere('p.approvalStatus = :status', { status: 'AP' });

    if (query.keyword) {
      qb.andWhere('p.productName ILIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.minInvestment !== undefined) {
      qb.andWhere('p.investmentFee >= :minInv', { minInv: query.minInvestment });
    }
    if (query.maxInvestment !== undefined) {
      qb.andWhere('p.investmentFee <= :maxInv', { maxInv: query.maxInvestment });
    }
    if (query.productTypeId?.length) {
      qb.innerJoin(
        ExhibitorProductHasType,
        'pivot',
        'pivot.eventsId = p.eventsId AND pivot.companyId = p.companyId AND pivot.productId = p.id AND pivot.productTypeId IN (:...typeIds)',
        { typeIds: query.productTypeId },
      ).distinct(true); // produk yang match >1 type gak boleh muncul dobel gara-gara JOIN
    }

    const [items, total] = await qb
      .orderBy('p.created', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const productTypeMap = await this.productTypeResolver.resolveForProducts(
      eventsId,
      items.map((p) => ({ companyId: p.companyId, productId: p.id })),
    );

    return {
      tab: 'products',
      items: items.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        productName: p.productName,
        productLogo: p.productLogo,
        investmentFee: p.investmentFee,
        productTypes: productTypeMap.get(`${p.companyId}-${p.id}`) ?? [],
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // Screen: Explore -> "Recently Viewed" section
  async getRecentlyViewed(eventsId: number, guestsId: number, limit = 10) {
    let logs: VisitorCompanyViewLog[];
    try {
      logs = await this.viewLogRepo.find({
        where: { eventsId, guestsId },
        order: { viewedAt: 'DESC' },
        take: limit,
      });
    } catch (err) {
      // Defensive: kalau tabel visitor_company_view_log ternyata beda
      // struktur dari asumsi, jangan crash Explore screen — cukup balikin
      // kosong & log warning.
      this.logger.warn(
        `Gagal query visitor_company_view_log (cek struktur tabel): ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
    if (!logs.length) return [];

    const companyIds = logs.map((l) => l.companyId);
    const companies = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.id IN (:...ids)', { ids: companyIds })
      .getMany();
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const boothMap = await this.boothResolver.resolveMany(eventsId, companyIds);

    // Urutan tetap ngikutin urutan viewedAt DESC dari log, bukan urutan hasil query company
    return logs
      .map((log) => {
        const c = companyMap.get(log.companyId);
        if (!c) return null;
        const booth = boothMap.get(c.id);
        return {
          id: c.id,
          companyName: c.companyName,
          logo: c.logo,
          hallLabel: booth?.hallLabel ?? null,
          boothLabel: booth?.boothLabel ?? null,
          viewedAt: log.viewedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}
