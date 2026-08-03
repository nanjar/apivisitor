import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { AiModule } from '../ai/ai.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExhibitorCompany, GuestTicket, Favorite, CheckinBooth]),
    AiModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
