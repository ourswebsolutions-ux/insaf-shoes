import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { hashPassword, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { email, password } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('admins');
  const d = z.object({ name: z.string().trim().min(1).max(120), email, password, role: z.enum(['super_admin', 'manager', 'staff']) }).parse(await readJson(req));
  await prisma.admin.create({ data: { name: d.name, email: d.email, role: d.role, password_hash: await hashPassword(d.password) } });
  return ok({ message: 'Admin user created.' });
});
