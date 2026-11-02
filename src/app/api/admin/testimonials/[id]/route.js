import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { testimonialSchema } from '@/lib/validation';

export const PUT = handler(async (req, { params }) => {
  await requireAdmin('content');
  await prisma.testimonial.update({ where: { id: Number((await params).id) || 0 }, data: testimonialSchema.parse(await readJson(req)) });
  return ok({ message: 'Testimonial saved.' });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('content');
  await prisma.testimonial.delete({ where: { id: Number((await params).id) || 0 } });
  return ok({ message: 'Testimonial deleted.' });
});
