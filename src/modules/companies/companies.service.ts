import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { In, IsNull, Repository } from 'typeorm';
import { ExhibitorCompany } from './entities/exhibitor-company.entity';
import { Exhibitor } from './entities/exhibitor.entity';
import { ExhibitorProduct } from './entities/exhibitor-product.entity';
import { ExhibitorProductHasType } from './entities/exhibitor-product-has-type.entity';
import { VisitorCompanyViewLog } from '../explore/entities/visitor-company-view-log.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { BoothResolverService } from '../checkin/booth-resolver.service';
import { ProductTypeResolverService } from '../product-types/product-type-resolver.service';
import { CompanyDetailResponseDto } from './dto/company-detail-response.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(Exhibitor)
    private readonly exhibitorRepo: Repository<Exhibitor>,
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
    @InjectRepository(VisitorCompanyViewLog)
    private readonly viewLogRepo: Repository<VisitorCompanyViewLog>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    private readonly boothResolver: BoothResolverService,
    private readonly productTypeResolver: ProductTypeResolverService,
    private readonly i18n: I18nService,
  ) {}

  async getDetail(
    eventsId: number,
    companyId: number,
    guestsId?: number,
  ): Promise<CompanyDetailResponseDto> {
    const company = await this.companyRepo.findOne({
      where: { eventsId, id: companyId },
    });
    if (!company) {
      throw new NotFoundException(this.i18n.t('messages.errors.companyNotFound'));
    }

    const [pics, totalProducts, booth, isFavorited] = await Promise.all([
      this.exhibitorRepo.find({
        where: { eventsId, companyId, approvalStatus: 'AP' },
        order: { inCharge: 'DESC' },
      }),
      this.productRepo.count({
        where: { eventsId, companyId, approvalStatus: 'AP' },
      }),
      this.boothResolver.resolveOne(eventsId, companyId),
      guestsId
        ? this.favoriteRepo
            .findOne({ where: { eventsId, guestsId, companyId, productId: IsNull() } })
            .then((f) => !!f)
        : Promise.resolve(false),
    ]);

    // Catat "Recently Viewed" — fire-and-forget, gak boleh gagalin response
    // Company Detail kalau logging-nya error (mis. schema tabel beda dari
    // asumsi). guestsId opsional karena endpoint ini secara teknis bisa
    // dipanggil tanpa konteks visitor tertentu di masa depan.
    if (guestsId) {
      this.recordView(eventsId, guestsId, companyId).catch((err) => {
        this.logger.warn(
          `Gagal catat recently-viewed (company ${companyId}, guest ${guestsId}): ${err instanceof Error ? err.message : err}`,
        );
      });
    }

    return {
      id: company.id,
      companyName: company.companyName,
      details: company.details,
      logo: company.logo,
      country: company.country,
      companyWebsite: company.companyWebsite,
      companyProfileUrl: company.companyProfileUrl,
      venueName: booth.venueName,
      hallLabel: booth.hallLabel,
      boothLabel: booth.boothLabel,
      isFavorited,
      pics: pics.map((p) => ({
        id: p.id,
        fullname: p.fullname,
        jobTitle: p.jobTitle,
        phone: `${p.countryCode ?? ''}${p.phone}`,
        email: p.exhibitorEmail,
      })),
      totalProducts,
    };
  }

  async getProducts(
    eventsId: number,
    companyId: number,
    page = 1,
    limit = 20,
    productTypeIds?: number[],
    guestsId?: number,
  ) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.eventsId = :eventsId', { eventsId })
      .andWhere('p.companyId = :companyId', { companyId })
      .andWhere('p.approvalStatus = :status', { status: 'AP' });

    if (productTypeIds?.length) {
      qb.innerJoin(
        ExhibitorProductHasType,
        'pivot',
        'pivot.eventsId = p.eventsId AND pivot.companyId = p.companyId AND pivot.productId = p.id AND pivot.productTypeId IN (:...typeIds)',
        { typeIds: productTypeIds },
      ).distinct(true); // produk yang match >1 type gak boleh muncul dobel gara-gara JOIN
    }

    const [items, total] = await qb
      .orderBy('p.created', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const productTypeMap = await this.productTypeResolver.resolveForProducts(
      eventsId,
      items.map((p) => ({ companyId: p.companyId, productId: p.id })),
    );

    // Semua produk di endpoint ini dari 1 company yang sama, jadi cukup 1
    // query batch (companyId fix, productId IN [...]) buat cek favorite.
    const favoritedProductIds = guestsId
      ? new Set(
          (
            await this.favoriteRepo.find({
              where: { eventsId, guestsId, companyId, productId: In(items.map((p) => p.id)) },
            })
          ).map((f) => f.productId),
        )
      : new Set<number | null>();

    return {
      items: items.map((p) => ({
        id: p.id,
        productName: p.productName,
        productLogo: p.productLogo,
        investmentFee: p.investmentFee,
        productDescription: p.productDescription,
        productTypes: productTypeMap.get(`${p.companyId}-${p.id}`) ?? [],
        isFavorited: favoritedProductIds.has(p.id),
      })),
      total,
      page,
      limit,
    };
  }

  private async recordView(eventsId: number, guestsId: number, companyId: number) {
    const existing = await this.viewLogRepo.findOne({ where: { eventsId, guestsId, companyId } });
    if (existing) {
      existing.viewedAt = new Date();
      await this.viewLogRepo.save(existing);
    } else {
      await this.viewLogRepo.save(
        this.viewLogRepo.create({ eventsId, guestsId, companyId, viewedAt: new Date() }),
      );
    }
  }
}
