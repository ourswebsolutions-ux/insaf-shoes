import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { bannerSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('content');
  await prisma.banner.create({ data: bannerSchema.parse(await readJson(req)) });
  return ok({ message: 'Banner created.' });
});
