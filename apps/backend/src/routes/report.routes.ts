import type { FastifyPluginAsync } from 'fastify';
import { reportService } from '../services/report.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/sales', async (request, reply) => {
    const query = request.query as { days?: string };
    const days = query.days ? parseInt(query.days, 10) : 30;
    const report = await reportService.getSalesReport(days);
    return reply.send({
      success: true,
      data: report
    });
  });

  fastify.get('/export/csv', async (_request, reply) => {
    const csv = await reportService.exportSalesReportCsv();
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="sales-report.csv"');
    return reply.send(csv);
  });
};
