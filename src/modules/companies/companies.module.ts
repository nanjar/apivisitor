import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitorCompany } from './entities/exhibitor-company.entity';
import { Exhibitor } from './entities/exhibitor.entity';
import { ExhibitorProduct } from './entities/exhibitor-product.entity';
import { VisitorCompanyViewLog } from '../explore/entities/visitor-company-view-log.entity';
import { CheckinModule } from '../checkin/checkin.module';
import { ProductTypesModule } from '../product-types/product-types.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExhibitorCompany, Exhibitor, ExhibitorProduct, VisitorCompanyViewLog]),
    CheckinModule,
    ProductTypesModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [TypeOrmModule],
})
export class CompaniesModule {}
