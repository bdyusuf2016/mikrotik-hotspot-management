import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Auth & Security API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  it('should authenticate super admin with valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'admin',
        password: 'Admin@1234'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.user.role).toBe('SUPER_ADMIN');
    expect(body.data.user.username).toBe('admin');
  });

  it('should reject invalid password with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'admin',
        password: 'WrongPassword99'
      }
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should block unauthenticated access to protected routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary'
    });

    expect(response.statusCode).toBe(401);
  });
});
