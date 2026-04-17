import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().trim().min(1).default('api'),
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().optional(),
  JWT_ACCESS_SECRET: Joi.string().min(16).optional(),
  JWT_REFRESH_SECRET: Joi.string().min(16).optional(),
  JWT_ACCESS_TTL: Joi.number().integer().positive().optional(),
  JWT_REFRESH_TTL: Joi.number().integer().positive().optional(),
  CORS_ORIGIN: Joi.string().optional(),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  STORAGE_DIR: Joi.string().optional(),
  S3_ENDPOINT: Joi.string().uri().optional(),
  S3_REGION: Joi.string().optional(),
  S3_BUCKET: Joi.string().optional(),
  S3_ACCESS_KEY_ID: Joi.string().optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().optional(),
  SMS_WEBHOOK_URL: Joi.string().uri().optional(),
  EXPOSE_DEV_OTP: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
    .optional(),
  CSRF_COOKIE_SECRET: Joi.string().min(16).optional(),
});
