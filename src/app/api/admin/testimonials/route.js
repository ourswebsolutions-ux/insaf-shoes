import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { testimonialSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('content');
  await prisma.testimonial.create({ data: testimonialSchema.parse(await readJson(req)) });
  return ok({ message: 'Testimonial added.' });
});
