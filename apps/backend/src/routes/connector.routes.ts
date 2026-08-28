import type { FastifyPluginAsync } from 'fastify';
import { connectorService, commandQueue } from '../services/connector.service.js';
import { ConnectorRegisterSchema, ConnectorHeartbeatSchema } from '@hotspot/shared';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware.js';
import type { ConnectorResponse, ConnectorAction } from '@hotspot/shared';

export const connectorRoutes: FastifyPluginAsync = async (fastify) => {
  // Public/Agent heartbeat endpoint
  fastify.post('/heartbeat', async (request, reply) => {
    const parsed = ConnectorHeartbeatSchema.parse(request.body);
    const ip = request.ip;
    const result = await connectorService.handleHeartbeat(parsed, ip);
    return reply.send({
      success: true,
      data: result
    });
  });

  // Agent command polling
  fastify.post('/commands/poll', async (request, reply) => {
    const { connectorId } = request.body as { connectorId: string };
    const commands = await connectorService.pollCommands(connectorId);
    return reply.send({
      success: true,
      data: commands
    });
  });

  // Agent submits result
  fastify.post('/commands/:commandId/result', async (request, reply) => {
    const response = request.body as ConnectorResponse;
    const result = await connectorService.submitCommandResult(response);
    return reply.send({
      success: true,
      data: result
    });
  });

  // Admin protected endpoints
  fastify.get('/', { preHandler: [authenticateToken] }, async (_request, reply) => {
    const connectors = await connectorService.getAllConnectors();
    return reply.send({
      success: true,
      data: connectors
    });
  });

  fastify.get('/commands/history', { preHandler: [authenticateToken] }, async (_request, reply) => {
    const history = await connectorService.getCommandHistory(25);
    return reply.send({
      success: true,
      data: history
    });
  });

  fastify.post('/commands/dispatch-test', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (request, reply) => {
    const { action, connectorId } = request.body as { action: ConnectorAction; connectorId?: string };
    const cmd = commandQueue.enqueue(action || 'GET_RESOURCES', { note: 'Manual admin diagnostics test' }, connectorId);
    return reply.send({
      success: true,
      data: cmd
    });
  });

  fastify.post('/register', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (request, reply) => {
    const parsed = ConnectorRegisterSchema.parse(request.body);
    const result = await connectorService.registerConnector(parsed.name);
    return reply.status(201).send({
      success: true,
      data: result
    });
  });

  fastify.post('/:id/revoke', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await connectorService.revokeConnector(id);
    return reply.send({
      success: true,
      data: { message: 'Connector revoked' }
    });
  });

  fastify.post('/:id/rotate-token', { preHandler: [authenticateToken, requireRoles('SUPER_ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await connectorService.rotateToken(id);
    return reply.send({
      success: true,
      data: result
    });
  });
};
