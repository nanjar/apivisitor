import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { IsNull, Not, Repository } from 'typeorm';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProductHasType } from '../companies/entities/exhibitor-product-has-type.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { ProductTypeResolverService } from '../product-types/product-type-resolver.service';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    private readonly productTypeResolver: ProductTypeResolverService,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Product Search — cari produk lintas semua company dalam 1 event
  async search(eventsId: number, guestsId: number, query: ProductSearchQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.eventsId = :eventsId', { eventsId })
      .andWhere('p.approvalStatus = :status', { status: 'AP' });

    if (query.keyword) {
      qb.andWhere(
        '(p.productName ILIKE :kw OR p.productDescription ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    // JOIN langsung ke pivot table (bukan fetch-id-dulu) — WAJIB match
    // events_id + company_id + product_id sekaligus karena product_id
    // gak unik lintas company (lihat catatan di ProductTypeResolverService).
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

    // N+1 sederhana untuk nama company; dataset per-page kecil (<=50) jadi
    // masih murah. Kalau traffic naik, ganti dengan LEFT JOIN manual karena
    // exhibitor_company & exhibitor_product tidak punya FK formal di skema.
    const companyIds = [...new Set(items.map((p) => p.companyId))];
    const companies = companyIds.length
      ? await this.companyRepo.find({ where: { eventsId } })
      : [];
    const companyMap = new Map(companies.map((c) => [c.id, c.companyName]));

    const productTypeMap = await this.productTypeResolver.resolveForProducts(
      eventsId,
      items.map((p) => ({ companyId: p.companyId, productId: p.id })),
    );

    // Produk bisa dari banyak company beda-beda, jadi ambil semua
    // product-favorite milik visitor ini sekali jalan, dicocokin di memory
    // pakai composite key companyId-productId (product_id gak unik lintas
    // company).
    const favoritedKeys = await this.getFavoritedProductKeys(eventsId, guestsId);

    return {
      items: items.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        companyName: companyMap.get(p.companyId) ?? null,
        productName: p.productName,
        productLogo: p.productLogo,
        investmentFee: p.investmentFee,
        productTypes: productTypeMap.get(`${p.companyId}-${p.id}`) ?? [],
        isFavorited: favoritedKeys.has(`${p.companyId}-${p.id}`),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private async getFavoritedProductKeys(eventsId: number, guestsId: number): Promise<Set<string>> {
    const favorites = await this.favoriteRepo.find({
      where: { eventsId, guestsId, productId: Not(IsNull()) },
    });
    return new Set(favorites.map((f) => `${f.companyId}-${f.productId}`));
  }

  // Screen: Product Catalog — daftar product type buat filter chip
  // ("All (24) | Automation | IoT | AI | Sensor")
  async listProductTypes(eventsId: number) {
    return this.productTypeResolver.listWithProductCount(eventsId);
  }

  // Detail satu produk (dibuka dari Product Catalog / Product Search)
  async getDetail(eventsId: number, companyId: number, productId: number, guestsId?: number) {
    const product = await this.productRepo.findOne({
      where: { eventsId, companyId, id: productId },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.errors.productNotFound'));
    }

    const [productTypeMap, favorite] = await Promise.all([
      this.productTypeResolver.resolveForProducts(eventsId, [{ companyId, productId }]),
      guestsId
        ? this.favoriteRepo.findOne({ where: { eventsId, guestsId, companyId, productId } })
        : Promise.resolve(null),
    ]);

    return {
      id: product.id,
      companyId: product.companyId,
      productName: product.productName,
      productLogo: product.productLogo,
      productDescription: product.productDescription,
      investmentFee: product.investmentFee,
      brochure: product.brochure,
      websiteUrl: product.websiteUrl,
      promoUrl: product.promoUrl,
      instagram: product.instagram,
      facebookUrl: product.facebookUrl,
      tiktokUrl: product.tiktokUrl,
      twitterUrl: product.twitterUrl,
      isFavorited: !!favorite,
      productTypes: productTypeMap.get(`${companyId}-${productId}`) ?? [],
    };
  }
}
