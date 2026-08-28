import type { FastifyPluginAsync } from 'fastify';
import { userService } from '../services/user.service.js';
import { HotspotUserCreateSchema, HotspotUserUpdateSchema } from '@hotspot/shared';
import { authenticateToken } from '../middlewares/auth.middleware.js';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', async (_request, reply) => {
    const users = await userService.getAllUsers();
    return reply.send({
      success: true,
      data: users
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await userService.getUserById(id);
    return reply.send({
      success: true,
      data: user
    });
  });

  fastify.post('/', async (request, reply) => {
    const parsed = HotspotUserCreateSchema.parse(request.body);
    const user = await userService.createUser(parsed, request.user?.username);
    return reply.status(201).send({
      success: true,
      data: user
    });
  });

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = HotspotUserUpdateSchema.parse(request.body);
    const user = await userService.updateUser(id, parsed, request.user?.username);
    return reply.send({
      success: true,
      data: user
    });
  });

  fastify.post('/:id/reset-password', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { password } = request.body as { password?: string };
    const newPass = password || Math.random().toString(36).slice(-8);
    await userService.resetPassword(id, newPass, request.user?.username);
    return reply.send({
      success: true,
      data: { password: newPass, message: 'Password updated successfully' }
    });
  });

  fastify.post('/:id/block', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = (request.body || {}) as { reason?: string };
    const user = await userService.blockUser(id, reason, request.user?.username);
    return reply.send({
      success: true,
      data: user
    });
  });

  fastify.post('/:id/unblock', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await userService.unblockUser(id, request.user?.username);
    return reply.send({
      success: true,
      data: user
    });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await userService.deleteUser(id, request.user?.username);
    return reply.send({
      success: true,
      data: { message: 'User removed successfully' }
    });
  });

  fastify.post('/:username/disconnect', async (request, reply) => {
    const { username } = request.params as { username: string };
    await userService.disconnectUser(username, request.user?.username);
    return reply.send({
      success: true,
      data: { message: `User ${username} session disconnected` }
    });
  });
};
