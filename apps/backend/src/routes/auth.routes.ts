import type { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/auth.service.js';
import { LoginSchema, RefreshTokenSchema } from '@hotspot/shared';
import { authenticateToken } from '../middlewares/auth.middleware.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const parsed = LoginSchema.parse(request.body);
    const result = await authService.login(parsed);
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.post('/refresh', async (request, reply) => {
    const parsed = RefreshTokenSchema.parse(request.body);
    const result = await authService.refreshToken(parsed.refreshToken);
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.post('/logout', { preHandler: [authenticateToken] }, async (_request, reply) => {
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  });

  fastify.get('/me', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = await authService.getCurrentUser(request.user!.sub);
    return reply.send({
      success: true,
      data: user
    });
  });
};
