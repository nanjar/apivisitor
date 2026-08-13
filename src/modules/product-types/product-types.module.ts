import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductType } from '../companies/entities/product-type.entity';
import { ExhibitorProductHasType } from '../companies/entities/exhibitor-product-has-type.entity';
import { ProductTypeResolverService } from './product-type-resolver.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductType, ExhibitorProductHasType])],
  providers: [ProductTypeResolverService],
  exports: [ProductTypeResolverService],
})
export class ProductTypesModule {}
