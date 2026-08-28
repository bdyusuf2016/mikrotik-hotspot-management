import type { FastifyPluginAsync } from 'fastify';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { DirectMikroTikAdapter } from '../adapters/mikrotik/direct.adapter.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { dbStore } from '../repositories/index.js';

export const mikrotikRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  const getAdapter = () => MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);

  fastify.get('/status', async (_request, reply) => {
    const adapter = getAdapter();
    const status = await adapter.getRouterStatus();
    return reply.send({
      success: true,
      data: status
    });
  });

  fastify.post('/test', async (_request, reply) => {
    const adapter = getAdapter();
    const result = await adapter.testConnection();
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.get('/config', async (_request, reply) => {
    const config = MikroTikAdapterFactory.getCurrentConfig();
    return reply.send({
      success: true,
      data: {
        ...config,
        password: config.password ? '••••••••' : ''
      }
    });
  });

  fastify.post('/config', async (request, reply) => {
    const body = request.body as any;
    if (!body || !body.host) {
      return reply.code(400).send({ success: false, message: 'Router host IP is required' });
    }

    const current = MikroTikAdapterFactory.getCurrentConfig();
    const updatedConfig = {
      host: body.host.trim(),
      port: Number(body.port) || 8728,
      useSsl: Boolean(body.useSsl),
      username: body.username ? body.username.trim() : 'admin',
      password: (body.password && body.password !== '••••••••') ? body.password : current.password,
      connectionMode: body.connectionMode || 'BACKEND_DIRECT_VPN',
      sstpServerHost: body.sstpServerHost || current.sstpServerHost,
      sstpUsername: body.sstpUsername || current.sstpUsername,
      sstpPassword: body.sstpPassword || current.sstpPassword
    };

    MikroTikAdapterFactory.setRouterConfig(updatedConfig);
    const adapter = getAdapter();
    const testResult = await adapter.testConnection().catch(err => ({
      reachable: false,
      authenticated: false,
      latencyMs: 0,
      error: (err as Error).message
    }));

    return reply.send({
      success: true,
      message: testResult.authenticated ? 'Router configuration updated and connected successfully!' : 'Router configuration saved, but test connection failed.',
      data: {
        config: {
          ...updatedConfig,
          password: '••••••••'
        },
        testResult
      }
    });
  });

  fastify.post('/test-custom', async (request, reply) => {
    const body = request.body as any;
    if (!body || !body.host) {
      return reply.code(400).send({ success: false, message: 'Router host IP is required' });
    }

    const tempAdapter = new DirectMikroTikAdapter({
      host: body.host.trim(),
      port: Number(body.port) || 8728,
      useSsl: Boolean(body.useSsl),
      username: body.username ? body.username.trim() : 'admin',
      password: body.password || 'admin',
      timeoutMs: 3500
    });

    const result = await tempAdapter.testConnection();
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.get('/sstp-script', async (request, reply) => {
    const query = request.query as any;
    const sstpServer = query.sstpServer || 'vpn.hotspot.local';
    const sstpUser = query.sstpUser || 'router-client-1';
    const sstpPass = query.sstpPass || 'vpnpassword123';
    const routerApiUser = query.apiUser || 'admin';
    const routerApiPass = query.apiPass || 'admin';

    const script = `# =========================================================
# MikroTik RouterOS Remote SSTP VPN & HotSpot Setup Script
# Yusuf Computer & IT HotSpot System
# =========================================================

# 1. Enable MikroTik API Service for Remote Web Dashboard Control
/ip service enable api
/ip service set api port=8728 disabled=no
/ip service enable api-ssl
/ip service set api-ssl port=8729 disabled=no

# 2. Configure SSTP VPN Client to Connect to Central Cloud Server
/interface sstp-client remove [find name="sstp-cloud-vpn"]
/interface sstp-client add \\
    name="sstp-cloud-vpn" \\
    connect-to="${sstpServer}" \\
    user="${sstpUser}" \\
    password="${sstpPass}" \\
    profile=default-encryption \\
    add-default-route=no \\
    disabled=no

# 3. Allow HotSpot and API Traffic through Firewall
/ip firewall filter add chain=input protocol=tcp dst-port=8728,8729 action=accept comment="Allow Hotspot Web Management API" place-before=0

# 4. Confirm Setup
:put ">>> SSTP VPN and API Configuration Completed Successfully! <<<"
`;

    return reply.send({
      success: true,
      data: { script }
    });
  });

  fastify.get('/resources', async (_request, reply) => {
    const adapter = getAdapter();
    const resources = await adapter.getResources();
    return reply.send({
      success: true,
      data: resources
    });
  });

  fastify.get('/interfaces', async (_request, reply) => {
    const adapter = getAdapter();
    const interfaces = await adapter.getInterfaces();
    return reply.send({
      success: true,
      data: interfaces
    });
  });

  fastify.get('/users', async (_request, reply) => {
    const adapter = getAdapter();
    const users = await adapter.getHotspotUsers();
    return reply.send({
      success: true,
      data: users
    });
  });

  fastify.get('/active-users', async (_request, reply) => {
    const adapter = getAdapter();
    const active = await adapter.getActiveSessions();
    return reply.send({
      success: true,
      data: active
    });
  });

  fastify.get('/server-profile', async (_request, reply) => {
    const adapter = getAdapter();
    const profile = await adapter.getServerProfile('hsprof1');
    return reply.send({
      success: true,
      data: profile
    });
  });

  fastify.put('/server-profile', async (request, reply) => {
    const adapter = getAdapter();
    const body = request.body as any;
    const success = await adapter.updateServerProfile(body, body?.name || 'hsprof1');
    return reply.send({
      success,
      message: success ? 'Server profile updated successfully' : 'Failed to update server profile'
    });
  });
};
