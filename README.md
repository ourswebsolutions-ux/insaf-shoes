# PunjabShop

Premium footwear e-commerce store for Pakistan, built with **Next.js 16 (App Router, JSX)**, **Prisma 7** and **MySQL / MariaDB**.

## Local setup

```bash
npm install                                  # also runs `prisma generate`
sudo mysql < db/create-database.sql          # once: creates the database + app user (edit the password inside first)
cp .env.example .env.local                   # put the same password in DATABASE_URL, and a long random JWT_SECRET
npm run db:setup                             # creates the tables and loads the demo catalog + admin user
npm run dev                                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run db:setup` | Applies migrations and seeds an empty database |
| `npm run db:migrate` | Applies new migrations (`prisma migrate deploy`) – use on the server |
| `npm run db:migrate:dev` | After editing `prisma/schema.prisma`, creates a new migration |
| `npm run db:seed -- --force` | Replaces the catalog, banners, coupons and testimonials with the demo data (orders and customers are kept) |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `node scripts/fetch-images.mjs` | Re-downloads the demo product photos into `public/imgs/` (only needed if they are missing) |

**Admin panel:** `/admin` — the seed creates `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your env file (defaults `admin@punjabshop.pk` / `Admin@12345`). Change the password under **My Account** straight away.

## Product photos

- `public/imgs/<category>/` – demo catalog photos (115 products, 127 photos). Sources and licences are listed in `public/imgs/CREDITS.md`: the shop's own photos plus Pexels/Unsplash photos, which are free for commercial use. Photos with visible brand logos were deliberately avoided.
- `public/images/` – the shop's original photos (kept untouched; cropped copies are used in the catalog).
- Photos uploaded from the admin panel are stored in `UPLOAD_DIR` (default `./uploads`) and served from `/uploads/...`. Keep that folder on persistent storage and back it up.

The demo catalog is defined in `prisma/catalog-data.mjs` (categories, products, prices, sizes, colours, banners).

## Admin panel (for the shop owner)

Menu: **Dashboard · Manage Products · Categories · Stock · Orders · Customers · Discounts · Reviews · Messages · Homepage · Store Settings**, plus **Add Product** at the top and **My Account / Log Out** at the bottom.

Deleting things is always confirmed with the exact number of products affected:

- **Manage Products** – tick products to show, hide or delete several at once, or delete one with its bin icon.
- **Categories → Open** – shows the category's products and offers **Delete All Products in This Category** (the category itself stays). If some products are also in other categories, you choose whether to delete them too or keep them there.
- **Delete category** – choose to move its products to another category, keep them in the shop, or delete the ones that are only in this category. Sub-categories move up a level.
- Orders, order history and customers are never deleted with products: order lines keep the product name, size, colour and price.

## Payments

| Method | Behaviour |
| --- | --- |
| Cash on Delivery | Order is placed as *pending / unpaid*. Optional COD fee and maximum order value. |
| Bank Transfer | Customer sees your bank details on the order page and submits a transaction ID → *pending verification* → admin marks it paid. |
| JazzCash | Hosted checkout. Only a correctly signed response with code `000` and the right amount marks an order paid. Return URL: `/api/payments/jazzcash/callback`. |
| Easypaisa | Hosted checkout. A successful return becomes *pending verification*; confirm it in the Easypaisa merchant portal. |

JazzCash and Easypaisa stay hidden at checkout until their merchant details are entered under **Store Settings → Payment options**.

## Production

- Set `DATABASE_URL`, a long random `JWT_SECRET` (`openssl rand -hex 32`) and the real `NEXT_PUBLIC_SITE_URL` in the server's env file. Never commit env files.
- `npm ci && npm run db:migrate && npm run build && npm start` (or run `npm start` under PM2).
- Serve over HTTPS; session cookies are `Secure` in production.
- Pages render on request, so `npm run build` does not need a database connection.
