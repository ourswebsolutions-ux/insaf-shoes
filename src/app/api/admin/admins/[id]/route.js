import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

export const PATCH = handler(async (req, { params }) => {
  const me = await requireAdmin('admins');
  const id = Number((await params).id) || 0;
  if (id === me.id) throw new AppError('You cannot change your own role or status.');
  const d = z.object({ role: z.enum(['super_admin', 'manager', 'staff']), status: z.enum(['active', 'disabled']) }).parse(await readJson(req));
  await prisma.admin.update({ where: { id }, data: d });
  return ok({ message: 'Admin updated.' });
});

export const DELETE = handler(async (_req, { params }) => {
  const me = await requireAdmin('admins');
  const id = Number((await params).id) || 0;
  if (id === me.id) throw new AppError('You cannot delete your own account.');
  await prisma.admin.delete({ where: { id } });
  return ok({ message: 'Admin deleted.' });
});
