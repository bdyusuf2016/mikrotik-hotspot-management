import type { FastifyPluginAsync } from 'fastify';
import { paymentService } from '../services/payment.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', async (_request, reply) => {
    const payments = await paymentService.getAllPayments();
    return reply.send({
      success: true,
      data: payments
    });
  });

  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    const payment = await paymentService.recordPayment(body, request.user?.username);
    return reply.status(201).send({
      success: true,
      data: payment
    });
  });

  fastify.post('/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };
    const payment = await paymentService.verifyPayment(id, request.user?.username);
    return reply.send({
      success: true,
      data: payment
    });
  });
};
