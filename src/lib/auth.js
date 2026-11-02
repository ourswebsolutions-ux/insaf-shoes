import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { AppError } from './errors';

export const CUSTOMER_COOKIE = 'ps_session';
export const ADMIN_COOKIE = 'ps_admin';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET must be set (min 16 chars)');
  return new TextEncoder().encode(s);
}

export async function signToken(payload, expiresIn) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export const hashPassword = (pw) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function setCustomerSession(customer) {
  const token = await signToken({ sub: String(customer.id), typ: 'customer' }, '30d');
  (await cookies()).set(CUSTOMER_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function setAdminSession(admin) {
  const token = await signToken({ sub: String(admin.id), typ: 'admin', role: admin.role }, '12h');
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 12 });
}

export async function clearSession(name) {
  (await cookies()).delete(name);
}

export async function getCustomer() {
  const payload = await verifyToken((await cookies()).get(CUSTOMER_COOKIE)?.value);
  if (payload?.typ !== 'customer') return null;
  return prisma.customer.findFirst({
    where: { id: Number(payload.sub) || 0, status: 'active' },
    select: { id: true, name: true, email: true, phone: true, created_at: true },
  });
}

export async function requireCustomer() {
  const customer = await getCustomer();
  if (!customer) throw new AppError('Please log in to continue.', 401);
  return customer;
}

export async function getAdmin() {
  const payload = await verifyToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (payload?.typ !== 'admin') return null;
  return prisma.admin.findFirst({
    where: { id: Number(payload.sub) || 0, status: 'active' },
    select: { id: true, name: true, email: true, role: true, last_login_at: true },
  });
}

// Role permissions for admin areas. super_admin can access everything.
const PERMISSIONS = {
  manager: ['dashboard', 'catalog', 'orders', 'customers', 'marketing', 'content', 'reviews'],
  staff: ['dashboard', 'orders', 'customers', 'reviews'],
};

export function adminCan(admin, area) {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  return (PERMISSIONS[admin.role] || []).includes(area);
}

export async function requireAdmin(area) {
  const admin = await getAdmin();
  if (!admin) throw new AppError('Admin authentication required.', 401);
  if (area && !adminCan(admin, area)) throw new AppError('You do not have permission for this action.', 403);
  return admin;
}

// Simple in-memory limiter for login endpoints (per process).
const attempts = globalThis.__punjabLoginAttempts || new Map();
globalThis.__punjabLoginAttempts = attempts;

export function rateLimit(key, max = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.reset < now) {
    attempts.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > max) throw new AppError('Too many attempts. Please try again in a few minutes.', 429);
}
