import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  DEFAULT_EVENTS_ID: Joi.number().required(),

  OLLAMA_BASE_URL: Joi.string().uri().required(),
  OLLAMA_MODEL: Joi.string().required(),
  OLLAMA_TIMEOUT_MS: Joi.number().default(30000),

  SWAGGER_ENABLED: Joi.string().valid('true', 'false').optional(),

  // Path ke file service account JSON Firebase (buat FCM push notification).
  // Kalau kosong, fitur push notification otomatis nonaktif (gak crash app).
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().optional(),

  // Webhook ke backend Exhibitor app — dipanggil pas visitor kirim pesan ke
  // PIC company, supaya sistem Exhibitor bisa trigger notifikasi ke PIC-nya
  // sendiri (device token PIC dikelola di sana, bukan di backend visitor ini).
  EXHIBITOR_CHAT_WEBHOOK_URL: Joi.string().uri().optional(),
  EXHIBITOR_CHAT_WEBHOOK_SECRET: Joi.string().optional(),
});
