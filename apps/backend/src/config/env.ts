import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:postgres@localhost:5432/mikrotik_hotspot'),
  JWT_SECRET: z.string().min(16).default('development-jwt-super-secret-key-32-chars-min!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development-jwt-refresh-super-secret-key-32-chars!'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  MIKROTIK_CONNECTION_MODE: z.enum(['MOCK', 'BACKEND_DIRECT_VPN', 'CONNECTOR_AGENT']).default('BACKEND_DIRECT_VPN'),
  MIKROTIK_MOCK_MODE: z.preprocess(v => v === 'true' || v === true, z.boolean()).default(false),
  MIKROTIK_HOST: z.string().default('10.10.13.38'),
  MIKROTIK_API_PORT: z.coerce.number().default(8728),
  MIKROTIK_API_SSL: z.preprocess(v => v === 'true' || v === true, z.boolean()).default(false),
  MIKROTIK_USERNAME: z.string().default(process.env.MIKROTIK_API_USER || process.env.MIKROTIK_USERNAME || 'admin'),
  MIKROTIK_PASSWORD: z.string().default(process.env.MIKROTIK_API_PASSWORD || process.env.MIKROTIK_PASSWORD || 'admin'),
  CONNECTOR_SECRET: z.string().default('connector-secret-key')
});

export const env = EnvSchema.parse(process.env);
