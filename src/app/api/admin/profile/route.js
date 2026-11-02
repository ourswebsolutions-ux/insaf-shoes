import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { hashPassword, requireAdmin, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { email, password } from '@/lib/validation';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email,
  current_password: z.string().optional().default(''),
  new_password: z.union([z.literal(''), password]).optional().default(''),
});

export const PUT = handler(async (req) => {
  const admin = await requireAdmin();
  const d = schema.parse(await readJson(req));
  const row = await prisma.admin.findUnique({ where: { id: admin.id }, select: { password_hash: true } });
  if ((d.new_password || d.email !== admin.email) && !(await verifyPassword(d.current_password, row.password_hash)))
    throw new AppError('Enter your current password to change email or password.', 400, { current_password: 'Incorrect password' });
  await prisma.admin.update({
    where: { id: admin.id },
    data: { name: d.name, email: d.email, ...(d.new_password ? { password_hash: await hashPassword(d.new_password) } : {}) },
  });
  return ok({ message: 'Profile updated.' });
});
