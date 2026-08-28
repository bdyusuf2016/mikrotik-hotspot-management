import { dbStore } from '../repositories/index.js';
import { comparePassword } from '../core/security.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../core/jwt.js';
import { UnauthorizedError } from '../core/errors.js';
import type { LoginInput, AdminUser } from '@hotspot/shared';

export class AuthService {
  async login(input: LoginInput): Promise<{ user: AdminUser; accessToken: string; refreshToken: string }> {
    await dbStore.initialize();

    let matchedAdmin: (AdminUser & { passwordHash: string }) | undefined;
    for (const admin of dbStore.admins.values()) {
      if (admin.username.toLowerCase() === input.username.toLowerCase()) {
        matchedAdmin = admin;
        break;
      }
    }

    if (!matchedAdmin || !matchedAdmin.isActive) {
      throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(input.password, matchedAdmin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    // Update last login
    matchedAdmin.lastLoginAt = new Date().toISOString();

    const payload = {
      sub: matchedAdmin.id,
      username: matchedAdmin.username,
      role: matchedAdmin.role,
      email: matchedAdmin.email
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    const { passwordHash: _, ...safeUser } = matchedAdmin;
    return {
      user: safeUser,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; user: AdminUser }> {
    await dbStore.initialize();
    try {
      const payload = await verifyRefreshToken(token);
      const admin = dbStore.admins.get(payload.sub);

      if (!admin || !admin.isActive) {
        throw new UnauthorizedError('Session expired or admin disabled', 'UNAUTHORIZED');
      }

      const newPayload = {
        sub: admin.id,
        username: admin.username,
        role: admin.role,
        email: admin.email
      };

      const accessToken = await signAccessToken(newPayload);
      const newRefreshToken = await signRefreshToken(newPayload);

      const { passwordHash: _, ...safeUser } = admin;
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: safeUser
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token', 'TOKEN_EXPIRED');
    }
  }

  async getCurrentUser(adminId: string): Promise<AdminUser> {
    await dbStore.initialize();
    const admin = dbStore.admins.get(adminId);
    if (!admin) {
      throw new UnauthorizedError('User not found');
    }
    const { passwordHash: _, ...safeUser } = admin;
    return safeUser;
  }
}

export const authService = new AuthService();
