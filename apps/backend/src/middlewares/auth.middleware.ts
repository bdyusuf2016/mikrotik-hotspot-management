import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type TokenPayload } from '../core/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../core/errors.js';
import type { Role } from '@hotspot/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authenticateToken(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyAccessToken(token);
    request.user = payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function requireRoles(...roles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (request.user.role === 'SUPER_ADMIN') {
      return; // Super Admin has access to all routes
    }

    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError(`Role ${request.user.role} does not have access to this resource`);
    }
  };
}
