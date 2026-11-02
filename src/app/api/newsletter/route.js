import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { prisma } from '@/lib/db';
import { email } from '@/lib/validation';

export const POST = handler(async (req) => {
  const data = z.object({ email }).parse(await readJson(req));
  await prisma.newsletterSubscriber.upsert({ where: { email: data.email }, create: { email: data.email }, update: {} });
  return ok({ message: 'Thank you for subscribing! Watch your inbox for offers.' });
});
