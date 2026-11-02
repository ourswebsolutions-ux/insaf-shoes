import 'server-only';
import { prisma } from './db';

/** All categories with the number of distinct products in each (sub-categories included). */
export async function categoriesWithCounts() {
  const [categories, links] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sort_order: 'asc' }, { name: 'asc' }] }),
    prisma.productCategory.findMany({ select: { product_id: true, category_id: true } }),
  ]);
  const byCategory = new Map();
  for (const l of links) {
    if (!byCategory.has(l.category_id)) byCategory.set(l.category_id, new Set());
    byCategory.get(l.category_id).add(l.product_id);
  }
  const childrenOf = (id) => categories.filter((c) => c.parent_id === id);
  const collect = (id, set = new Set()) => {
    for (const p of byCategory.get(id) || []) set.add(p);
    for (const c of childrenOf(id)) collect(c.id, set);
    return set;
  };
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return categories.map((c) => ({
    ...c,
    parent_name: c.parent_id ? names.get(c.parent_id) || null : null,
    product_count: collect(c.id).size,
  }));
}
