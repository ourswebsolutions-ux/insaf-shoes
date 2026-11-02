import { handler, ok } from '@/lib/api';
import { getProductBySlug } from '@/lib/catalog';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

// Lightweight product payload for the quick-add dialog.
export const GET = handler(async (_req, { params }) => {
  const { id } = await params;
  const row = await prisma.product.findFirst({ where: { id: Number(id) || 0, status: 'active' }, select: { slug: true } });
  if (!row) throw new AppError('Product not found', 404);
  const p = await getProductBySlug(row.slug);
  return ok({
    product: { id: p.id, name: p.name, slug: p.slug, price: p.price, sale_price: p.sale_price, images: p.images.slice(0, 1), variants: p.variants },
  });
});
