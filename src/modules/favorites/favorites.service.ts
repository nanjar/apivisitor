import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
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

  // Screen: Favorites — tombol simpan/hapus (toggle) di card company/product.
  // productId undefined = favorite COMPANY. productId diisi = favorite
  // PRODUCT (companyId WAJIB tetap diisi, itu company pemilik produknya —
  // product_id gak unik lintas company jadi gak bisa berdiri sendiri).
  async toggle(eventsId: number, guestsId: number, dto: ToggleFavoriteDto) {
    const productId = dto.productId ?? null;
    const existing = await this.favoriteRepo.findOne({
      where: {
        eventsId,
        guestsId,
        companyId: dto.companyId,
        productId: productId === null ? IsNull() : productId,
      },
    });

    if (existing) {
      await this.favoriteRepo.remove(existing);
      return { favorited: false };
    }

    await this.favoriteRepo.save(
      this.favoriteRepo.create({
        eventsId,
        guestsId,
        companyId: dto.companyId,
        productId,
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

    // Company favorite = productId NULL. Product favorite = productId diisi.
    const companyFavorites = favorites.filter((f) => f.productId === null);
    const productFavorites = favorites.filter((f) => f.productId !== null);

    const companyIds = companyFavorites.map((f) => f.companyId);
    const companies = companyIds.length
      ? await this.companyRepo
          .createQueryBuilder('c')
          .where('c.eventsId = :eventsId', { eventsId })
          .andWhere('c.id IN (:...ids)', { ids: companyIds })
          .getMany()
      : [];

    // Product HARUS di-resolve pakai companyId+productId sekaligus (product_id
    // gak unik lintas company) — query per company biar composite-key-safe.
    const productsByCompany = new Map<number, number[]>();
    for (const f of productFavorites) {
      const list = productsByCompany.get(f.companyId) ?? [];
      list.push(f.productId!);
      productsByCompany.set(f.companyId, list);
    }
    const productResults = await Promise.all(
      [...productsByCompany.entries()].map(([companyId, productIds]) =>
        this.productRepo.find({
          where: { eventsId, companyId, id: In(productIds) },
        }),
      ),
    );
    const products = productResults.flat();

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
