import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { ExhibitorProduct } from '../companies/entities/exhibitor-product.entity';
import { Session } from '../schedule/entities/session.entity';
import { Agenda } from '../schedule/entities/agenda.entity';
import { EventSpeaker } from '../speakers/entities/event-speaker.entity';
import { AiModule } from '../ai/ai.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExhibitorCompany, ExhibitorProduct, Session, Agenda, EventSpeaker]),
    AiModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
