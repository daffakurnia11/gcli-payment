import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DOKU_BASE_URL: z.string().url().default('https://api-sandbox.doku.com'),
  DOKU_CLIENT_ID: z.string().min(1),
  DOKU_SECRET_KEY: z.string().min(1),
  DOKU_CREATE_PAYMENT_PATH: z.string().default('/checkout/v1/payment'),
  DOKU_MODIFY_PAYMENT_PATH: z.string().optional(),
  DOKU_CANCEL_PAYMENT_PATH: z.string().optional(),
  DOKU_WEBHOOK_PATH: z.string().default('/api/webhooks/doku'),
  MARIADB_HOST: z.string().default('127.0.0.1'),
  MARIADB_PORT: z.coerce.number().default(3306),
  MARIADB_USER: z.string().min(1),
  MARIADB_PASSWORD: z.string().default(''),
  MARIADB_DATABASE: z.string().min(1),
  MARIADB_POOL_LIMIT: z.coerce.number().default(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Environment validation failed: ${parsed.error.message}`);
}

export const env = parsed.data;
