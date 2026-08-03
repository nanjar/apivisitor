import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(ExhibitorProduct)
    private readonly productRepo: Repository<ExhibitorProduct>,
  ) {}

  // Screen: Favorites — tombol simpan/hapus (toggle) di card company/product
  async toggle(eventsId: number, guestsId: number, dto: ToggleFavoriteDto) {
    const existing = await this.favoriteRepo.findOne({
      where: { eventsId, guestsId, targetType: dto.targetType, targetId: dto.targetId },
    });

    if (existing) {
      await this.favoriteRepo.remove(existing);
      return { favorited: false };
    }

    await this.favoriteRepo.save(
      this.favoriteRepo.create({
        eventsId,
        guestsId,
        targetType: dto.targetType,
        targetId: dto.targetId,
      }),
    );
    return { favorited: true };
  }

  // Screen: Favorites — daftar company & product yang di-favorite
  async list(eventsId: number, guestsId: number) {
    const favorites = await this.favoriteRepo.find({
      where: { eventsId, guestsId },
      order: { createdAt: 'DESC' },
    });

    const companyIds = favorites.filter((f) => f.targetType === 'COMPANY').map((f) => f.targetId);
    const productIds = favorites.filter((f) => f.targetType === 'PRODUCT').map((f) => f.targetId);

    const [companies, products] = await Promise.all([
      companyIds.length
        ? this.companyRepo
            .createQueryBuilder('c')
            .where('c.eventsId = :eventsId', { eventsId })
            .andWhere('c.id IN (:...ids)', { ids: companyIds })
            .getMany()
        : Promise.resolve([]),
      productIds.length
        ? this.productRepo
            .createQueryBuilder('p')
            .where('p.eventsId = :eventsId', { eventsId })
            .andWhere('p.id IN (:...ids)', { ids: productIds })
            .getMany()
        : Promise.resolve([]),
    ]);

    return {
      companies: companies.map((c) => ({ id: c.id, companyName: c.companyName, logo: c.logo })),
      products: products.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        productName: p.productName,
        productLogo: p.productLogo,
      })),
    };
  }
}
