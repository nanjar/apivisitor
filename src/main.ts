import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Redis adapter buat Socket.IO (ChatGateway visitor) - biar broadcast
  // real-time sampai lintas server ke apiexhibitor. Fail-open: kalau
  // REDIS_HOST kosong/connect gagal, fallback ke in-memory adapter.
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Serve file statis (logo, favicon) buat kebutuhan branding Swagger UI.
  // Taruh file kamu di folder `public/` — otomatis bisa diakses via
  // https://<domain>/logo.png, https://<domain>/favicon.ico, dst.
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  // Swagger docs di /api/docs. Dimatiin otomatis di production kecuali
  // SWAGGER_ENABLED=true di-set eksplisit — dokumentasi API publik bisa
  // jadi peta serangan buat orang luar kalau ke-expose gak sengaja.
  const swaggerEnabled =
    configService.get<string>('NODE_ENV') !== 'production' ||
    configService.get<string>('SWAGGER_ENABLED') === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Undangin Visitor API')
      .setDescription(
        'API backend untuk Undangin Visitor App. Semua endpoint (kecuali /auth/login dan /auth/refresh) ' +
          'butuh Bearer token dari hasil login. Kirim header X-Lang: en untuk respons Bahasa Inggris.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token hasil dari POST /auth/login',
        },
        'access-token',
      )
      .addTag('Auth', 'Login via token tiket, refresh token')
      .addTag('Home', 'Home Dashboard')
      .addTag('Explore', 'Pencarian company/product/kategori')
      .addTag('Companies', 'Detail company, PIC, katalog produk')
      .addTag('Products', 'Pencarian & detail produk lintas company')
      .addTag('Appointments', 'Booking & daftar appointment')
      .addTag('Chat', 'Chat list, history, kirim pesan (REST fallback)')
      .addTag('Schedule', 'Event schedule / rundown')
      .addTag('Speakers', 'Daftar & detail pembicara')
      .addTag('Venue', 'Interactive floor map')
      .addTag('Favorites', 'Simpan/hapus company & product favorit')
      .addTag('Notifications', 'Daftar & tandai notifikasi')
      .addTag('Facilities', 'Fasilitas event (toilet, mushola, dst)')
      .addTag('Badge', 'QR badge visitor & riwayat checkin booth')
      .addTag('Profile', 'Lihat & update profil visitor')
      .addTag('Settings', 'Preferensi bahasa & notifikasi')
      .addTag('AI Assistant', 'Chatbot AI (Ollama) seputar event')
      .addTag('Search', 'Universal search berbasis bahasa natural (Ollama)')
      .addTag('Recommendations', 'Rekomendasi exhibitor berbasis AI')
      .addTag('Analytics', 'Statistik aktivitas visitor sendiri')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
      // Judul tab browser
      customSiteTitle: 'Undangin Visitor API Docs',
      // Favicon tab browser — taruh favicon.ico kamu di folder public/
      customfavIcon: '/favicon.ico',
      // Ganti logo default Swagger. Logo aslinya di-render sebagai inline
      // <svg> (bukan <img>), jadi gak bisa di-override pakai `content: url()`
      // kayak img biasa — pendekatannya: sembunyiin SVG + teks "Swagger",
      // terus pasang logo kita sebagai background-image di elemen link-nya.
      customCss: `
        .swagger-ui .topbar { background-color: #0f172a; padding: 10px 0; }
        .swagger-ui .topbar .topbar-wrapper .link svg,
        .swagger-ui .topbar .topbar-wrapper .link span {
          display: none !important;
        }
        .swagger-ui .topbar .topbar-wrapper .link {
          content: '';
          display: inline-block;
          background-image: url('/logo.png');
          background-repeat: no-repeat;
          background-position: left center;
          background-size: contain;
          width: 180px;
          height: 40px;
        }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
      `,
    });
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Undangin Visitor API listening on port ${port}`);
  if (swaggerEnabled) {
    // eslint-disable-next-line no-console
    console.log(`Swagger docs available at /api/docs`);
  }
}
bootstrap();
