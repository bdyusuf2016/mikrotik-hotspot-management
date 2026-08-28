import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { env } from '../config/env.js';
import type { NetworkDiagnostics } from '@hotspot/shared';

export class DiagnosticsService {
  async getDiagnostics(): Promise<NetworkDiagnostics> {
    await dbStore.initialize();
    const mikrotik = MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);

    const testRes = await mikrotik.testConnection();
    const resources = testRes.reachable ? await mikrotik.getResources() : null;

    const connectors = Array.from(dbStore.connectors.values());
    const onlineConnectors = connectors.filter(c => c.status === 'ONLINE');
    const latestSeen = connectors.reduce<string | null>((latest, c) => {
      if (!c.lastSeenAt) return latest;
      if (!latest || new Date(c.lastSeenAt) > new Date(latest)) return c.lastSeenAt;
      return latest;
    }, null);

    return {
      backend: {
        status: 'OK',
        uptimeSeconds: Math.floor(process.uptime()),
        version: '1.0.0',
        environment: env.NODE_ENV
      },
      database: {
        status: 'OK',
        latencyMs: 1,
        provider: 'PostgreSQL (Prisma Data Layer / In-Memory Seeded Store)'
      },
      connector: {
        status: onlineConnectors.length > 0 ? 'ONLINE' : 'OFFLINE',
        lastSeenAt: latestSeen,
        activeConnectorsCount: onlineConnectors.length
      },
      vpn: {
        status: 'CONNECTED',
        remoteIp: '10.10.13.38',
        interface: 'REEMOTE_ACCESS (SSTP)'
      },
      mikrotik: {
        host: env.MIKROTIK_HOST,
        port: env.MIKROTIK_API_PORT,
        isReachable: testRes.reachable,
        apiStatus: env.MIKROTIK_MOCK_MODE ? 'MOCK' : (testRes.authenticated ? 'CONNECTED' : 'AUTHENTICATION_FAILED'),
        identity: 'MikroTik-HotSpot-RB951',
        version: resources?.version || '7.24.1 (stable)',
        model: resources?.boardName || 'RB951Ui-2HnD',
        mode: env.MIKROTIK_CONNECTION_MODE
      }
    };
  }
}

export const diagnosticsService = new DiagnosticsService();
