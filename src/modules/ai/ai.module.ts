import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { OllamaService } from './ollama.service';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, ExhibitorCompany])],
  controllers: [AssistantController],
  providers: [OllamaService, AssistantService],
  exports: [OllamaService],
})
export class AiModule {}
