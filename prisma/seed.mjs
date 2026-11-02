// Seeds an empty database (run with `npx prisma db seed` or `npm run db:seed`) with an admin account, categories, demo products,
// homepage banners, testimonials and coupons. Safe to re-run: it skips seeding
// when products already exist (use --force to wipe catalog data first).
// Pass --with-demo-orders to also create sample customers and orders.
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createPrisma } from '../src/lib/prisma-client.mjs';
import { BANNERS, CATEGORIES, CATEGORY_IMAGES, COLORS, PRODUCTS, productImagePaths } from './catalog-data.mjs';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const args = new Set(process.argv.slice(2));
const prisma = createPrisma();


// ---------------------------------------------------------------- admin
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@punjabshop.pk';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
if (!existingAdmin) {
  await prisma.admin.create({
    data: { name: 'Store Admin', email: adminEmail, password_hash: await bcrypt.hash(adminPassword, 12), role: 'super_admin' },
  });
  console.log(`Created admin ${adminEmail}`);
}

const productCount = await prisma.product.count();
if (productCount > 0 && !args.has('--force')) {
  console.log('Catalog already seeded. Use --force to reseed catalog data.');
  await prisma.$disconnect();
  process.exit(0);
}
if (args.has('--force')) {
  // Order history is kept: order items only lose their link to the deleted product.
  for (const model of ['cartItem', 'cart', 'wishlist', 'review', 'productCategory', 'productImage', 'productVariant', 'product', 'category', 'banner', 'testimonial', 'coupon']) {
    await prisma[model].deleteMany();
  }
}
// Product photos live in public/imgs/ (see scripts/fetch-images.mjs). Fail early if they are missing.
const missing = PRODUCTS.flatMap(productImagePaths).filter((p) => !fs.existsSync(path.join('public', p)));
if (missing.length) {
  console.error(`Missing ${missing.length} product images (e.g. ${missing[0]}). Run: node scripts/fetch-images.mjs`);
  process.exit(1);
}

// ---------------------------------------------------------------- categories
const firstImage = Object.fromEntries(PRODUCTS.map((p) => [p.slug, productImagePaths(p)[0]]));
const cat = {};
for (const c of CATEGORIES) {
  const created = await prisma.category.create({
    data: {
      parent_id: c.parent ? cat[c.parent] : null,
      name: c.name,
      menu_label: c.menu || null,
      slug: c.key,
      description: c.desc || null,
      image: firstImage[CATEGORY_IMAGES[c.key]] || null,
      show_in_menu: !!c.menuOn,
      show_on_home: !!c.home,
      sort_order: c.sort,
    },
  });
  cat[c.key] = created.id;
}

// ---------------------------------------------------------------- products
let skuN = 1001;
const productIds = [];
for (const [i, p] of PRODUCTS.entries()) {
  const sku = `PS-${skuN++}`;
  // Spread creation dates so "Newest" sorting has a natural order; new arrivals are the most recent.
  const created = new Date(Date.now() - (PRODUCTS.length - i) * 36e5 * (p.newA ? 1 : 24));
  const variants = [];
  for (const color of p.colors) {
    for (const size of p.sizes) {
      const stock = crypto.randomInt(0, 6) === 0 ? crypto.randomInt(0, 3) : crypto.randomInt(4, 25);
      variants.push({ sku: `${sku}-${color.slice(0, 3).toUpperCase()}-${size}`, size, color, color_hex: COLORS[color] || null, stock });
    }
  }
  const sold = p.best ? crypto.randomInt(300, 1300) : crypto.randomInt(20, 300);
  const ratingCount = Math.round(sold * 0.6);
  const product = await prisma.product.create({
    data: {
      name: p.name,
      slug: p.slug,
      sku,
      short_description: p.desc.split('. ')[0].replace(/\.$/, '') + '.',
      description: p.desc,
      price: p.price,
      sale_price: p.sale || null,
      is_featured: !!p.featured,
      is_best_seller: !!p.best,
      is_new_arrival: !!p.newA,
      sold_count: sold,
      view_count: sold * 4,
      rating_avg: (41 + crypto.randomInt(0, 8)) / 10,
      rating_count: ratingCount,
      created_at: created,
      categories: { create: [...new Set(p.cats)].map((key) => ({ category_id: cat[key] })) },
      images: { create: productImagePaths(p).map((url, k) => ({ url, alt: p.name, sort_order: k })) },
      variants: { create: variants },
    },
  });
  productIds.push(product.id);
}
console.log(`Seeded ${PRODUCTS.length} products in ${CATEGORIES.length} categories`);

// ---------------------------------------------------------------- homepage content
for (const b of BANNERS) {
  const { photo, file, sort, ...rest } = b;
  await prisma.banner.create({ data: { ...rest, image: `/imgs/banners/${file}.jpg`, sort_order: sort } });
}

const testimonials = [
  ['Ahmed Raza', 'Excellent quality and super fast delivery! Highly recommended!', 5],
  ['Ayesha Khan', 'Trendy collection and great prices. I will shop again!', 5],
  ['Usman Ali', 'Best online footwear store in Pakistan.', 5],
  ['Sana Tariq', 'The heels fit perfectly and the COD process was smooth.', 4],
  ['Bilal Ahmed', 'Ordered formal shoes for my brother’s wedding – premium leather and great finish.', 5],
  ['Hira Shah', 'Easy exchange for a different size, very helpful support team.', 5],
];
for (const [i, [name, quote, rating]] of testimonials.entries()) {
  await prisma.testimonial.create({ data: { name, quote, rating, sort_order: i } });
}

await prisma.coupon.createMany({
  data: [
    { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, min_order: 2000, max_discount: 1000, per_customer_limit: 1 },
    { code: 'FLAT500', description: 'Rs. 500 off on orders above Rs. 6,000', type: 'fixed', value: 500, min_order: 6000, usage_limit: 500 },
  ],
});

const reviewSeed = [
  ['Ahmed Raza', 5, 'Excellent quality', 'Very comfortable and exactly as shown in the pictures. Delivered in 2 days to Lahore.'],
  ['Fatima Noor', 4, 'Good value', 'Nice finishing and good packaging. Size runs slightly small so order one size up.'],
  ['Kamran Akhtar', 5, 'Highly recommended', 'Second time ordering from PunjabShop and again very satisfied. Cash on delivery was smooth.'],
];
// A few sample reviews on the first products (the shop's own stock).
for (const pid of productIds.slice(0, 8)) {
  for (const [name, rating, title, comment] of reviewSeed) {
    await prisma.review.create({ data: { product_id: pid, name, rating, title, comment, is_verified_purchase: true, status: 'approved' } });
  }
}

// ---------------------------------------------------------------- optional demo orders
if (args.has('--with-demo-orders')) {
  const names = [['Ali Hassan', 'Lahore', 'Punjab'], ['Zainab Bibi', 'Karachi', 'Sindh'], ['Hamza Iqbal', 'Islamabad', 'Islamabad Capital Territory'], ['Maryam Javed', 'Faisalabad', 'Punjab'], ['Imran Khan', 'Peshawar', 'Khyber Pakhtunkhwa'], ['Nida Aslam', 'Multan', 'Punjab']];
  const customerIds = [];
  for (const [i, [name]] of names.entries()) {
    const c = await prisma.customer.create({
      data: {
        name,
        email: `${name.split(' ')[0].toLowerCase()}${i}@example.com`,
        phone: `0300${String(1000000 + i * 1234567).slice(0, 7)}`,
        password_hash: await bcrypt.hash('Customer@123', 10),
      },
    });
    customerIds.push(c.id);
  }
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];
  for (let i = 0; i < 40; i++) {
    const ci = i % names.length;
    const [name, city, province] = names[ci];
    const pid = productIds[crypto.randomInt(0, productIds.length)];
    const v = await prisma.productVariant.findFirst({
      where: { product_id: pid },
      include: { product: { select: { name: true, price: true, sale_price: true, sku: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } } } },
    });
    const unit = v.product.sale_price || v.product.price;
    const qty = crypto.randomInt(1, 3);
    const subtotal = unit * qty;
    const shipping = subtotal >= 5000 ? 0 : 250;
    const status = statuses[crypto.randomInt(0, statuses.length)];
    const created = new Date(Date.now() - crypto.randomInt(0, 30) * 864e5 - crypto.randomInt(0, 864e5));
    const method = ['cod', 'cod', 'cod', 'bank_transfer'][crypto.randomInt(0, 4)];
    const payStatus = status === 'delivered' ? 'paid' : method === 'cod' ? 'unpaid' : 'pending_verification';
    const history = [{ status: 'pending', note: 'Order placed', created_by: 'Customer', created_at: created }];
    if (status !== 'pending') history.push({ status, created_by: 'Store Admin', created_at: new Date(created.getTime() + 864e5) });
    await prisma.order.create({
      data: {
        order_number: `PS${created.toISOString().slice(2, 10).replace(/-/g, '')}${10000 + i}`,
        access_token: crypto.randomBytes(16).toString('hex'),
        customer_id: customerIds[ci],
        name,
        phone: '03001234567',
        address: `House ${i + 1}, Street ${ci + 3}, Main Boulevard`,
        city,
        province,
        subtotal,
        shipping_fee: shipping,
        total: subtotal + shipping,
        payment_method: method,
        payment_status: payStatus,
        status,
        stock_restored: status === 'cancelled',
        created_at: created,
        items: {
          create: {
            product_id: pid,
            variant_id: v.id,
            product_name: v.product.name,
            sku: v.product.sku,
            size: v.size,
            color: v.color,
            image: v.product.images[0]?.url || null,
            unit_price: unit,
            quantity: qty,
            line_total: subtotal,
          },
        },
        payments: { create: { method, amount: subtotal + shipping, status: payStatus === 'paid' ? 'paid' : 'initiated' } },
        history: { create: history },
      },
    });
  }
  console.log('Seeded demo customers and orders (password: Customer@123)');
}

console.log('Seed complete.');
await prisma.$disconnect();
