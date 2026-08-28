import type { FastifyPluginAsync } from 'fastify';
import { packageService } from '../services/package.service.js';
import { profileService } from '../services/profile.service.js';
import { HotspotPackageSchema } from '@hotspot/shared';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware.js';

export const packageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateToken);

  fastify.get('/', async (_request, reply) => {
    const packages = await packageService.getAllPackages();
    return reply.send({
      success: true,
      data: packages
    });
  });

  fastify.get('/profiles', async (_request, reply) => {
    const profiles = profileService.getStandardProfiles();
    return reply.send({
      success: true,
      data: profiles
    });
  });

  fastify.post('/profiles/sync', { preHandler: [requireRoles('ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const result = await profileService.syncProfilesToRouter(request.user?.username);
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pkg = await packageService.getPackageById(id);
    return reply.send({
      success: true,
      data: pkg
    });
  });

  fastify.post('/', { preHandler: [requireRoles('ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const parsed = HotspotPackageSchema.parse(request.body);
    const pkg = await packageService.createPackage(parsed);
    return reply.status(201).send({
      success: true,
      data: pkg
    });
  });

  fastify.put('/:id', { preHandler: [requireRoles('ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = HotspotPackageSchema.partial().parse(request.body);
    const pkg = await packageService.updatePackage(id, parsed);
    return reply.send({
      success: true,
      data: pkg
    });
  });

  fastify.delete('/:id', { preHandler: [requireRoles('ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await packageService.deletePackage(id);
    return reply.send({
      success: true,
      data: { message: 'Package deleted successfully' }
    });
  });
};
