import 'server-only';
import { cache } from 'react';
import { prisma, query, queryOne } from './db';

export const PRICE_SQL = 'CASE WHEN p.sale_price > 0 AND p.sale_price < p.price THEN p.sale_price ELSE p.price END';

const CARD_FIELDS = `
  p.id, p.name, p.slug, p.price, p.sale_price, p.rating_avg, p.rating_count, p.sold_count,
  p.is_new_arrival, p.created_at,
  (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order, id LIMIT 1) AS image,
  (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order, id LIMIT 1 OFFSET 1) AS image2,
  (SELECT COALESCE(SUM(stock), 0) FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active') AS stock,
  (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active') AS variant_count,
  (SELECT MIN(id) FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active') AS first_variant_id,
  (SELECT GROUP_CONCAT(DISTINCT color ORDER BY color SEPARATOR ',') FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active') AS colors`;

function toCard(row) {
  return {
    ...row,
    stock: Number(row.stock),
    variant_count: Number(row.variant_count),
    colors: row.colors ? row.colors.split(',') : [],
    // Quick add is only possible when there is nothing to choose.
    quick_variant_id: Number(row.variant_count) === 1 ? row.first_variant_id : null,
  };
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    const ia = SIZE_ORDER.indexOf(String(a).toUpperCase());
    const ib = SIZE_ORDER.indexOf(String(b).toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    return String(a).localeCompare(String(b));
  });
}

export const getCategories = cache(async ({ includeInactive = false } = {}) => {
  return query(
    `SELECT c.*, (SELECT COUNT(*) FROM product_categories pc JOIN products p ON p.id = pc.product_id
       WHERE pc.category_id = c.id AND p.status = 'active') AS product_count
     FROM categories c ${includeInactive ? '' : "WHERE c.status = 'active'"}
     ORDER BY c.sort_order, c.name`
  );
});

export function buildTree(categories) {
  const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id).children.push(c);
    else roots.push(c);
  }
  return roots;
}

export const getMenuCategories = cache(async () => {
  const all = await getCategories();
  return buildTree(all).filter((c) => c.show_in_menu);
});

export const getCategoryBySlug = cache(async (slug) => {
  const all = await getCategories();
  const cat = all.find((c) => c.slug === slug);
  if (!cat) return null;
  return {
    ...cat,
    parent: all.find((c) => c.id === cat.parent_id) || null,
    children: all.filter((c) => c.parent_id === cat.id),
  };
});

async function descendantIds(categoryIds) {
  const all = await getCategories();
  const result = new Set(categoryIds);
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      if (c.parent_id && result.has(c.parent_id) && !result.has(c.id)) {
        result.add(c.id);
        added = true;
      }
    }
  }
  return [...result];
}

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: `${PRICE_SQL} ASC`,
  price_desc: `${PRICE_SQL} DESC`,
  best_selling: 'p.sold_count DESC, p.id DESC',
  popularity: '(p.rating_avg * LEAST(p.rating_count, 50) + p.view_count / 20 + p.sold_count) DESC',
  rating: 'p.rating_avg DESC, p.rating_count DESC',
};

/**
 * Filterable product listing used by the shop, category and search pages.
 * All filters are optional.
 */
export async function listProducts(filters = {}) {
  const where = ["p.status = 'active'"];
  const params = [];

  if (filters.categoryIds?.length) {
    const ids = await descendantIds(filters.categoryIds);
    where.push(`p.id IN (SELECT product_id FROM product_categories WHERE category_id IN (${ids.map(() => '?').join(',')}))`);
    params.push(...ids);
  }
  if (filters.q) {
    where.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.sku = ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, filters.q);
  }
  if (filters.minPrice != null) {
    where.push(`${PRICE_SQL} >= ?`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    where.push(`${PRICE_SQL} <= ?`);
    params.push(filters.maxPrice);
  }
  if (filters.sizes?.length) {
    where.push(
      `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' AND v.stock > 0 AND v.size IN (${filters.sizes.map(() => '?').join(',')}))`
    );
    params.push(...filters.sizes);
  }
  if (filters.colors?.length) {
    where.push(
      `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' AND v.color IN (${filters.colors.map(() => '?').join(',')}))`
    );
    params.push(...filters.colors);
  }
  if (filters.inStock) {
    where.push("EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' AND v.stock > 0)");
  }
  if (filters.onSale) where.push('p.sale_price > 0 AND p.sale_price < p.price');
  if (filters.minDiscount) {
    where.push('p.sale_price > 0 AND (p.price - p.sale_price) / p.price * 100 >= ?');
    params.push(filters.minDiscount);
  }
  if (filters.flag === 'featured') where.push('p.is_featured = 1');
  if (filters.flag === 'best_seller') where.push('p.is_best_seller = 1');
  if (filters.flag === 'new_arrival') where.push('p.is_new_arrival = 1');
  if (filters.ids?.length) {
    where.push(`p.id IN (${filters.ids.map(() => '?').join(',')})`);
    params.push(...filters.ids);
  }
  if (filters.excludeId) {
    where.push('p.id <> ?');
    params.push(filters.excludeId);
  }

  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 60);
  const page = Math.max(Number(filters.page) || 1, 1);
  const order = SORTS[filters.sort] || SORTS.newest;
  const whereSql = where.join(' AND ');

  const [items, countRow] = await Promise.all([
    query(`SELECT ${CARD_FIELDS} FROM products p WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [
      ...params,
      limit,
      (page - 1) * limit,
    ]),
    queryOne(`SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`, params),
  ]);

  return {
    items: items.map(toCard),
    total: Number(countRow.total),
    page,
    pages: Math.max(1, Math.ceil(Number(countRow.total) / limit)),
    limit,
  };
}

/** Products in the given order (used for admin-picked homepage sections). */
export async function getProductsByIds(ids) {
  if (!ids?.length) return [];
  const { items } = await listProducts({ ids, limit: 60 });
  const byId = new Map(items.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(Number(id))).filter(Boolean);
}

export async function getFacets(categoryIds) {
  const params = [];
  let catSql = '';
  if (categoryIds?.length) {
    const ids = await descendantIds(categoryIds);
    catSql = `AND p.id IN (SELECT product_id FROM product_categories WHERE category_id IN (${ids.map(() => '?').join(',')}))`;
    params.push(...ids);
  }
  const [sizes, colors, range] = await Promise.all([
    query(
      `SELECT DISTINCT v.size FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE p.status = 'active' AND v.status = 'active' AND v.size IS NOT NULL ${catSql}`,
      params
    ),
    query(
      `SELECT v.color, MAX(v.color_hex) AS hex FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE p.status = 'active' AND v.status = 'active' AND v.color IS NOT NULL ${catSql} GROUP BY v.color ORDER BY v.color`,
      params
    ),
    queryOne(`SELECT MIN(${PRICE_SQL}) AS min, MAX(${PRICE_SQL}) AS max FROM products p WHERE p.status = 'active' ${catSql}`, params),
  ]);
  return {
    sizes: sortSizes(sizes.map((s) => s.size)),
    colors: colors.map((c) => ({ name: c.color, hex: c.hex })),
    minPrice: Math.floor(Number(range?.min) || 0),
    maxPrice: Math.ceil(Number(range?.max) || 0),
  };
}

export const getProductBySlug = cache(async (slug, { includeInactive = false } = {}) => {
  const product = await prisma.product.findFirst({
    where: { slug, ...(includeInactive ? {} : { status: 'active' }) },
    include: {
      images: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }], select: { id: true, url: true, alt: true } },
      variants: {
        where: { status: 'active' },
        orderBy: { id: 'asc' },
        select: { id: true, sku: true, size: true, color: true, color_hex: true, price_adjustment: true, stock: true },
      },
      categories: {
        where: { category: { status: 'active' } },
        select: { category: { select: { id: true, name: true, slug: true, parent_id: true, sort_order: true } } },
      },
    },
  });
  if (!product) return null;
  const categories = product.categories
    .map((c) => c.category)
    .sort((a, b) => (a.parent_id != null) - (b.parent_id != null) || a.sort_order - b.sort_order);
  return { ...product, categories };
});

export async function getRelatedProducts(product, limit = 5) {
  const categoryIds = product.categories.map((c) => c.id);
  const { items } = await listProducts({ categoryIds, excludeId: product.id, sort: 'best_selling', limit });
  if (items.length >= limit) return items;
  const more = await listProducts({ excludeId: product.id, sort: 'popularity', limit: limit * 2 });
  const seen = new Set(items.map((i) => i.id));
  return [...items, ...more.items.filter((i) => !seen.has(i.id))].slice(0, limit);
}

export async function getApprovedReviews(productId, limit = 20) {
  return prisma.review.findMany({
    where: { product_id: productId, status: 'approved' },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: { id: true, name: true, rating: true, title: true, comment: true, is_verified_purchase: true, created_at: true },
  });
}

export async function refreshProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { product_id: productId, status: 'approved' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating_avg: agg._avg.rating || 0, rating_count: agg._count._all },
  });
}
