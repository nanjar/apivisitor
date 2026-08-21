import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';
import { ProductsService } from './products.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Screen: Product Search
  @Get('search')
  search(@CurrentUser() user: CurrentVisitor, @Query() query: ProductSearchQueryDto) {
    return this.productsService.search(user.eventsId, user.guestsId, query);
  }

  // Filter chip "All (24) | Automation | IoT | AI | Sensor" di Product Catalog
  @Get('types')
  listTypes(@CurrentUser() user: CurrentVisitor) {
    return this.productsService.listProductTypes(user.eventsId);
  }

  // Detail produk (dibuka dari card produk)
  @Get('company/:companyId/:productId')
  getDetail(
    @CurrentUser() user: CurrentVisitor,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.productsService.getDetail(user.eventsId, companyId, productId, user.guestsId);
  }
}
