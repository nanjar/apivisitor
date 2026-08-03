import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Companies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Screen: Company Detail
  @Get(':id')
  getDetail(@CurrentUser() user: CurrentVisitor, @Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getDetail(user.eventsId, id, user.guestsId);
  }

  // Screen: Product Catalog (produk milik satu company)
  @Get(':id/products')
  getProducts(
    @CurrentUser() user: CurrentVisitor,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.companiesService.getProducts(user.eventsId, id, Number(page) || 1, Number(limit) || 20);
  }
}
