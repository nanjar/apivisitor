import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Product Search — cari produk lintas semua company dalam 1 event
  async search(eventsId: number, query: ProductSearchQueryDto) {
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

    return {
      items: items.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        companyName: companyMap.get(p.companyId) ?? null,
        productName: p.productName,
        productLogo: p.productLogo,
        investmentFee: p.investmentFee,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // Detail satu produk (dibuka dari Product Catalog / Product Search)
  async getDetail(eventsId: number, companyId: number, productId: number) {
    const product = await this.productRepo.findOne({
      where: { eventsId, companyId, id: productId },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.errors.productNotFound'));
    }

    return {
      id: product.id,
      companyId: product.companyId,
      productName: product.productName,
      productLogo: product.productLogo,
      productDescription: product.productDescription,
      investmentFee: product.investmentFee,
      brochure: product.brochure,
    };
  }
}
