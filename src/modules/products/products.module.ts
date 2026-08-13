import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ProductTypesModule } from '../product-types/product-types.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExhibitorProduct, ExhibitorCompany]), ProductTypesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
