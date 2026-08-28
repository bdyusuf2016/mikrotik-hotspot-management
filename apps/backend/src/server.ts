import { buildApp } from './app.js';
import { env } from './config/env.js';

async function startServer() {
  try {
    const app = await buildApp();
    const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 MikroTik HotSpot Management Backend running at: ${address}`);
    app.log.info(`📡 Mode: ${env.MIKROTIK_CONNECTION_MODE} | Mock Mode: ${env.MIKROTIK_MOCK_MODE}`);
    app.log.info(`🔒 Safe RouterOS Simulation Active. No changes will be sent to live router.`);
  } catch (err) {
    console.error('Fatal server start error:', err);
    process.exit(1);
  }
}

startServer();
