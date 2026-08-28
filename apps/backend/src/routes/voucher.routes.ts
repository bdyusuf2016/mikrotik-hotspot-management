import type { FastifyPluginAsync } from 'fastify';
import { voucherService } from '../services/voucher.service.js';
import { VoucherGenerateSchema } from '@hotspot/shared';
import { authenticateToken } from '../middlewares/auth.middleware.js';

export const voucherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', async (request, reply) => {
    const query = request.query as { packageId?: string; status?: string };
    const vouchers = await voucherService.getAllVouchers(query.packageId, query.status);
    return reply.send({
      success: true,
      data: vouchers
    });
  });

  fastify.get('/export/csv', async (request, reply) => {
    const query = request.query as { packageId?: string };
    const csv = await voucherService.exportVouchersCsv(query.packageId);
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="hotspot-vouchers.csv"');
    return reply.send(csv);
  });

  fastify.post('/generate', async (request, reply) => {
    const parsed = VoucherGenerateSchema.parse(request.body);
    const vouchers = await voucherService.generateVouchers(parsed, request.user?.username);
    return reply.status(201).send({
      success: true,
      data: vouchers
    });
  });

  fastify.post('/:id/disable', async (request, reply) => {
    const { id } = request.params as { id: string };
    const voucher = await voucherService.disableVoucher(id, request.user?.username);
    return reply.send({
      success: true,
      data: voucher
    });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await voucherService.deleteVoucher(id, request.user?.username);
    return reply.send({
      success: true,
      data: { message: 'Voucher removed successfully' }
    });
  });

  fastify.delete('/batch/:batchId', async (request, reply) => {
    const { batchId } = request.params as { batchId: string };
    const count = await voucherService.deleteBatch(batchId, request.user?.username);
    return reply.send({
      success: true,
      data: { message: `Batch ${batchId} deleted (${count} vouchers removed)` }
    });
  });

  fastify.delete('/all', async (request, reply) => {
    const count = await voucherService.clearAllVouchers(request.user?.username);
    return reply.send({
      success: true,
      data: { message: `Cleared ${count} vouchers` }
    });
  });

  fastify.post('/activate', async (request, reply) => {
    const { code, username } = request.body as { code: string; username: string };
    const voucher = await voucherService.activateVoucher(code, username || 'voucher_user');
    return reply.send({
      success: true,
      data: voucher
    });
  });
};
