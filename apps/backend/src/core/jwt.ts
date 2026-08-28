import * as jose from 'jose';
import { env } from '../config/env.js';
import type { Role } from '@hotspot/shared';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface TokenPayload {
  sub: string;
  username: string;
  role: Role;
  email: string;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecretKey);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, secretKey);
  return {
    sub: payload.sub as string,
    username: payload.username as string,
    role: payload.role as Role,
    email: payload.email as string
  };
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, refreshSecretKey);
  return {
    sub: payload.sub as string,
    username: payload.username as string,
    role: payload.role as Role,
    email: payload.email as string
  };
}
