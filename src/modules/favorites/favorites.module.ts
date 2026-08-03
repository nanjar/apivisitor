import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, ExhibitorCompany, ExhibitorProduct])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
