import type { FastifyPluginAsync } from 'fastify';
import { diagnosticsService } from '../services/diagnostics.service.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware.js';
import { dbStore } from '../repositories/index.js';
import { SystemSettingsUpdateSchema } from '@hotspot/shared';
import { PortalTemplateService } from '../services/portal-template.service.js';

export const diagnosticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/diagnostics', { preHandler: [authenticateToken] }, async (_request, reply) => {
    const diag = await diagnosticsService.getDiagnostics();
    return reply.send({
      success: true,
      data: diag
    });
  });

  fastify.get('/audit-logs', { preHandler: [authenticateToken] }, async (_request, reply) => {
    await dbStore.initialize();
    return reply.send({
      success: true,
      data: dbStore.auditLogs.slice(0, 20)
    });
  });

  fastify.get('/settings', { preHandler: [authenticateToken] }, async (_request, reply) => {
    await dbStore.initialize();
    return reply.send({
      success: true,
      data: dbStore.settings
    });
  });

  fastify.put('/settings', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (request, reply) => {
    await dbStore.initialize();
    const parsed = SystemSettingsUpdateSchema.parse(request.body);
    dbStore.settings = {
      ...dbStore.settings,
      ...parsed
    };

    // Auto-sync new branding & credits directly to MikroTik Captive Portal files
    await PortalTemplateService.pushTemplatesToRouter(dbStore.settings).catch(() => {});

    return reply.send({
      success: true,
      data: dbStore.settings
    });
  });

  fastify.post('/settings/sync-portal', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (_request, reply) => {
    await dbStore.initialize();
    const synced = await PortalTemplateService.pushTemplatesToRouter(dbStore.settings);
    return reply.send({
      success: synced,
      message: synced ? 'Hotspot portal successfully synced to router' : 'Failed to sync portal to router'
    });
  });
};
