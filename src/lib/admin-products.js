import 'server-only';
import { prisma } from './db';

/** Rows for the admin product tables. `where` is a Prisma product filter. */
export async function productRows(where, { skip = 0, take = 25 } = {}) {
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
      select: {
        id: true, name: true, slug: true, sku: true, price: true, sale_price: true, status: true, low_stock_threshold: true,
        images: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }], take: 1, select: { url: true } },
        variants: { where: { status: 'active' }, select: { stock: true } },
        categories: { select: { category: { select: { id: true, name: true, parent_id: true, parent: { select: { name: true } } } } } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return {
    total,
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      sale_price: p.sale_price,
      status: p.status,
      low_stock_threshold: p.low_stock_threshold,
      image: p.images[0]?.url || null,
      stock: p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0),
      // Skip a parent category when one of its sub-categories is listed too.
      categories: p.categories
        .map(({ category }) => category)
        .filter((c, _, all) => !all.some((o) => o.parent_id === c.id))
        .map((c) => (c.parent ? `${c.parent.name} › ${c.name}` : c.name)),
    })),
  };
}
