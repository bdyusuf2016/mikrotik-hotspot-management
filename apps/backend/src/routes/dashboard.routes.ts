import type { FastifyPluginAsync } from 'fastify';
import { dashboardService } from '../services/dashboard.service.js';
import { expiryService } from '../services/expiry.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { dbStore } from '../repositories/index.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', async (_request, reply) => {
    const summary = await dashboardService.getSummary();
    return reply.send({
      success: true,
      data: summary
    });
  });

  fastify.get('/summary', async (_request, reply) => {
    const summary = await dashboardService.getSummary();
    return reply.send({
      success: true,
      data: summary
    });
  });

  fastify.post('/run-expiry-sweep', async (request, reply) => {
    const result = await expiryService.runExpirySweep(request.user?.username || 'admin');
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.get('/traffic', async (_request, reply) => {
    const mikrotik = MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);
    const traffic = await mikrotik.getTrafficRates();
    return reply.send({
      success: true,
      data: traffic
    });
  });

  fastify.get('/sales', async (_request, reply) => {
    await dbStore.initialize();
    const payments = Array.from(dbStore.payments.values()).filter(p => p.status === 'SUCCESS');
    const totalBDT = payments.reduce((sum, p) => sum + p.amount, 0);

    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    const todayBDT = payments
      .filter(p => new Date(p.createdAt).getTime() >= oneDayAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthBDT = payments
      .filter(p => new Date(p.createdAt).getTime() >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const breakdownMap: Record<string, { salesBDT: number; count: number }> = {};
    for (const p of payments) {
      const name = p.packageName || 'Direct';
      if (!breakdownMap[name]) breakdownMap[name] = { salesBDT: 0, count: 0 };
      breakdownMap[name].salesBDT += p.amount;
      breakdownMap[name].count += 1;
    }

    return reply.send({
      success: true,
      data: {
        todayBDT,
        monthBDT,
        totalBDT,
        currency: 'BDT',
        breakdownByPackage: Object.entries(breakdownMap).map(([packageName, stat]) => ({
          packageName,
          salesBDT: stat.salesBDT,
          count: stat.count
        }))
      }
    });
  });
};
