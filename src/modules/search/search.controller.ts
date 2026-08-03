import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { UniversalSearchDto } from './dto/universal-search.dto';
import { SearchService } from './search.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Search')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Screen: Universal Search
  @Post('universal')
  search(@CurrentUser() user: CurrentVisitor, @Body() dto: UniversalSearchDto) {
    return this.searchService.search(user.eventsId, dto.query);
  }
}
