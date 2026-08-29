import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { packageRoutes } from './routes/package.routes.js';
import { voucherRoutes } from './routes/voucher.routes.js';
import { mikrotikRoutes } from './routes/mikrotik.routes.js';
import { connectorRoutes } from './routes/connector.routes.js';
import { diagnosticsRoutes } from './routes/diagnostics.routes.js';
import { paymentRoutes } from './routes/payment.routes.js';
import { reportRoutes } from './routes/report.routes.js';
import { dbStore } from './repositories/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    trustProxy: true
  });

  // Safe JSON Body Parser handling empty bodies seamlessly
  app.addContentTypeParser('application/json', { parseAs: 'string' }, function (_req, body, done) {
    try {
      const strBody = typeof body === 'string' ? body : body?.toString('utf-8') || '';
      if (!strBody.trim()) {
        done(null, {});
        return;
      }
      const json = JSON.parse(strBody);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  // CORS Policy
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.split(',').includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Rate Limiting (120 reqs / min)
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Root welcome and health check endpoints
  app.get('/', async () => ({
    success: true,
    service: 'MikroTik HotSpot Management System Backend API',
    status: 'ONLINE',
    version: '1.0.0',
    mode: env.MIKROTIK_CONNECTION_MODE,
    mock: env.MIKROTIK_MOCK_MODE,
    apiPrefix: '/api',
    healthCheck: '/health',
    timestamp: new Date().toISOString()
  }));

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: env.MIKROTIK_CONNECTION_MODE,
    mock: env.MIKROTIK_MOCK_MODE
  }));

  app.get('/api', async () => ({
    success: true,
    message: 'MikroTik HotSpot REST API v1.0',
    endpoints: {
      auth: '/api/auth/login',
      dashboard: '/api/dashboard',
      users: '/api/users',
      packages: '/api/packages',
      vouchers: '/api/vouchers',
      mikrotik: '/api/mikrotik/status',
      connectors: '/api/connectors',
      reports: '/api/reports'
    },
    timestamp: new Date().toISOString()
  }));

  // Register API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(packageRoutes, { prefix: '/api/packages' });
  await app.register(voucherRoutes, { prefix: '/api/vouchers' });
  await app.register(mikrotikRoutes, { prefix: '/api/mikrotik' });
  await app.register(connectorRoutes, { prefix: '/api/connectors' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(diagnosticsRoutes, { prefix: '/api' });

  // Initialize DB in-memory store
  await dbStore.initialize();

  return app;
}
