import { handler, ok, readJson } from '@/lib/api';
import { rateLimit, setAdminSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { loginSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  const data = loginSchema.parse(await readJson(req));
  rateLimit(`admin-login:${data.email}`, 6);
  const admin = await prisma.admin.findUnique({ where: { email: data.email } });
  if (!admin || !(await verifyPassword(data.password, admin.password_hash))) throw new AppError('Incorrect email or password.', 401);
  if (admin.status !== 'active') throw new AppError('This admin account is disabled.', 403);
  await setAdminSession(admin);
  await prisma.admin.update({ where: { id: admin.id }, data: { last_login_at: new Date() } });
  return ok({ ok: true });
});
