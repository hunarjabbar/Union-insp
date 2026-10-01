// FILE: src/lib/auth.ts
// STAGE: 3
// UPDATED: 2026-10-01
import argon2 from 'argon2';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '4d89a74cf978e8b0b92416b245037d894b9f6de3910c4d44cb25f9b4c0e6631b';

const accessSecretKey = new TextEncoder().encode(JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(JWT_REFRESH_SECRET);

export const COOKIE_NAME = 'union_inspection_token';
export const REFRESH_COOKIE_NAME = 'union_inspection_refresh_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 600,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
  stationId?: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    email: payload.email,
    stationId: payload.stationId ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(accessSecretKey);
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecretKey);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload & AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecretKey);
  return {
    ...payload,
    sub: payload.sub as string,
    role: payload.role as Role,
    email: payload.email as string,
    stationId: (payload.stationId as string) || undefined,
  };
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload & RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecretKey);
  return {
    ...payload,
    sub: payload.sub as string,
    sessionId: payload.sessionId as string,
  };
}

export async function setAuthCookies(accessToken: string, refreshToken?: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  }
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE_NAME, '', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
}
