import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { LogLinkClickDto } from '../analytics/dto/log-link-click.dto';

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
    // Bisa 1 nilai (?productTypeId=1) atau banyak (?productTypeId=1&productTypeId=2)
    // — Express otomatis kasih array kalau query key-nya diulang.
    @Query('productTypeId') productTypeId?: string | string[],
  ) {
    const productTypeIds = productTypeId
      ? (Array.isArray(productTypeId) ? productTypeId : [productTypeId]).map(Number)
      : undefined;
    return this.companiesService.getProducts(
      user.eventsId,
      id,
      Number(page) || 1,
      Number(limit) || 20,
      productTypeIds,
      user.guestsId,
    );
  }

  // Screen: Company Detail / Product Detail - klik tombol IG/FB/TikTok/
  // website/brosur. productId di body opsional (isi kalau klik dari
  // Product Detail).
  @Post(':id/click')
  logClick(
    @CurrentUser() user: CurrentVisitor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogLinkClickDto,
  ) {
    return this.companiesService.logLinkClick(
      user.eventsId,
      id,
      dto.linkType,
      dto.productId,
      user.guestsId,
    );
  }
}
