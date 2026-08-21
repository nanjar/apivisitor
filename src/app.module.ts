import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import databaseConfig from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DateFormatInterceptor } from './common/interceptors/date-format.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { HomeModule } from './modules/home/home.module';
import { ExploreModule } from './modules/explore/explore.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ProductsModule } from './modules/products/products.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ChatModule } from './modules/chat/chat.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SpeakersModule } from './modules/speakers/speakers.module';
import { VenueModule } from './modules/venue/venue.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { BadgeModule } from './modules/badge/badge.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { AiModule } from './modules/ai/ai.module';
import { SearchModule } from './modules/search/search.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PushNotificationsModule } from './modules/push-notifications/push-notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    I18nModule.forRoot({
      // Default 'id' karena mayoritas visitor event di Indonesia.
      // Override via header 'x-lang: en', query '?lang=en', atau
      // 'Accept-Language: en' (urutan prioritas sesuai resolvers di bawah).
      fallbackLanguage: 'id',
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: process.env.NODE_ENV === 'development',
      },
      resolvers: [
        new HeaderResolver(['x-lang']),
        new QueryResolver(['lang']),
        AcceptLanguageResolver,
      ],
    }),
    AuthModule,
    HomeModule,
    ExploreModule,
    CompaniesModule,
    ProductsModule,
    AppointmentsModule,
    ChatModule,
    ScheduleModule,
    SpeakersModule,
    VenueModule,
    FavoritesModule,
    NotificationsModule,
    FacilitiesModule,
    BadgeModule,
    ProfileModule,
    CheckinModule,
    AiModule,
    SearchModule,
    RecommendationsModule,
    AnalyticsModule,
    SettingsModule,
    PushNotificationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
  ],
})
export class AppModule {}
