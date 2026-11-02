import 'server-only';
import { prisma } from './db';
import { slugify } from './slug';

/** `model` is a Prisma delegate name with a unique `slug` field, e.g. 'product'. */
export async function uniqueSlug(model, base, excludeId) {
  const root = slugify(base) || 'item';
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await prisma[model].findFirst({ where: { slug, NOT: { id: excludeId || 0 } }, select: { id: true } });
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
}

/** Creates or updates a product with its categories, images and variants atomically. */
export async function saveProduct(data, id) {
  const slug = await uniqueSlug('product', data.slug || data.name, id);
  const fields = {
    name: data.name,
    slug,
    sku: data.sku,
    short_description: data.short_description,
    description: data.description || null,
    price: data.price,
    sale_price: data.sale_price,
    status: data.status,
    is_featured: !!data.is_featured,
    is_best_seller: !!data.is_best_seller,
    is_new_arrival: !!data.is_new_arrival,
    low_stock_threshold: data.low_stock_threshold,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
  };

  return prisma.$transaction(async (tx) => {
    const product = id ? await tx.product.update({ where: { id }, data: fields }) : await tx.product.create({ data: fields });
    const productId = product.id;

    const categoryIds = (await tx.category.findMany({ where: { id: { in: [...new Set(data.category_ids)] } }, select: { id: true } })).map((c) => c.id);
    await tx.productCategory.deleteMany({ where: { product_id: productId } });
    await tx.productCategory.createMany({ data: categoryIds.map((category_id) => ({ product_id: productId, category_id })) });

    await tx.productImage.deleteMany({ where: { product_id: productId } });
    if (data.images.length) {
      await tx.productImage.createMany({
        data: data.images.map((img, i) => ({ product_id: productId, url: img.url, alt: img.alt || data.name, sort_order: i })),
      });
    }

    const existingIds = new Set((await tx.productVariant.findMany({ where: { product_id: productId }, select: { id: true } })).map((v) => v.id));
    const keep = new Set();
    for (const v of data.variants) {
      const vals = {
        sku: v.sku,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex,
        price_adjustment: v.price_adjustment || 0,
        stock: v.stock,
        status: v.status,
      };
      if (v.id && existingIds.has(v.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: vals });
        keep.add(v.id);
      } else {
        await tx.productVariant.create({ data: { ...vals, product_id: productId } });
      }
    }
    const remove = [...existingIds].filter((vid) => !keep.has(vid));
    if (remove.length) await tx.productVariant.deleteMany({ where: { id: { in: remove } } });
    return productId;
  });
}

/** Ids of a category plus all of its sub-categories (any depth). */
export async function categoryFamily(categoryId) {
  const all = await prisma.category.findMany({ select: { id: true, parent_id: true } });
  const ids = new Set([categoryId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of all) if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) ids.add(c.id), (grew = true);
  }
  const ancestors = [];
  let cursor = all.find((c) => c.id === categoryId)?.parent_id;
  while (cursor) {
    ancestors.push(cursor);
    cursor = all.find((c) => c.id === cursor)?.parent_id;
  }
  return { ids: [...ids], ancestors };
}

/**
 * Products in a category (including its sub-categories), split into those that
 * belong only to this category's family and those also listed elsewhere.
 * `directOnly` limits it to products linked to the category itself.
 */
export async function categoryProductBreakdown(categoryId, { directOnly = false } = {}) {
  const { ids, ancestors } = await categoryFamily(categoryId);
  const scope = directOnly ? [categoryId] : ids;
  const family = new Set([...ids, ...ancestors]);
  const products = await prisma.product.findMany({
    where: { categories: { some: { category_id: { in: scope } } } },
    select: { id: true, categories: { select: { category_id: true } } },
  });
  const exclusive = [];
  const shared = [];
  for (const p of products) (p.categories.every((c) => family.has(c.category_id)) ? exclusive : shared).push(p.id);
  return { all: products.map((p) => p.id), exclusive, shared, familyIds: ids };
}

/**
 * Permanently deletes products. Order history is kept: order items store the
 * product name, size, colour and price, and their product link is set to NULL.
 */
export async function deleteProducts(ids) {
  if (!ids.length) return 0;
  const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  return count;
}
