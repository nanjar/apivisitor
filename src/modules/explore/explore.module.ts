import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { VisitorCompanyViewLog } from './entities/visitor-company-view-log.entity';
import { CheckinModule } from '../checkin/checkin.module';
import { ProductTypesModule } from '../product-types/product-types.module';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExhibitorCompany, ExhibitorProduct, VisitorCompanyViewLog]),
    CheckinModule,
    ProductTypesModule,
  ],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [TypeOrmModule],
})
export class ExploreModule {}
