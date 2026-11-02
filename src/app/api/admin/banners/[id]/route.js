import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { bannerSchema } from '@/lib/validation';

export const PUT = handler(async (req, { params }) => {
  await requireAdmin('content');
  await prisma.banner.update({ where: { id: Number((await params).id) || 0 }, data: bannerSchema.parse(await readJson(req)) });
  return ok({ message: 'Banner saved.' });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('content');
  await prisma.banner.delete({ where: { id: Number((await params).id) || 0 } });
  return ok({ message: 'Banner deleted.' });
});
