import { z } from 'zod';
import { normalizePkPhone, PROVINCES } from './pakistan';

const trimmed = (max, label) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const optional = (max) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

export const pkPhone = z
  .string({ error: 'Phone number is required' })
  .transform((v, ctx) => {
    const n = normalizePkPhone(v);
    if (!n) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid Pakistani mobile number, e.g. 03001234567' });
      return z.NEVER;
    }
    return n;
  });

export const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(190);
export const password = z.string().min(8, 'Password must be at least 8 characters').max(100);

export const registerSchema = z.object({
  name: trimmed(120, 'Name'),
  email,
  phone: pkPhone,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });

export const checkoutSchema = z.object({
  name: trimmed(120, 'Full name'),
  phone: pkPhone,
  email: z.union([email, z.literal('')]).optional().nullable().transform((v) => v || null),
  address: trimmed(500, 'Address').refine((v) => v.length >= 10, 'Please enter your complete address'),
  city: trimmed(80, 'City'),
  province: z.enum(PROVINCES, { error: 'Select your province' }),
  postal_code: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, 'Postal code must be 5 digits')
    .optional()
    .nullable(),
  notes: optional(1000),
  payment_method: z.enum(['cod', 'jazzcash', 'easypaisa', 'bank_transfer'], { error: 'Select a payment method' }),
  coupon_code: optional(40),
  save_address: z.boolean().optional(),
});

export const addressSchema = checkoutSchema.pick({ name: true, phone: true, address: true, city: true, province: true, postal_code: true }).extend({
  is_default: z.boolean().optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Select a rating').max(5),
  title: optional(190),
  comment: trimmed(2000, 'Review').refine((v) => v.length >= 10, 'Please write at least 10 characters'),
  name: optional(120),
});

export const contactSchema = z.object({
  name: trimmed(120, 'Name'),
  email: z.union([email, z.literal('')]).optional().transform((v) => v || null),
  phone: z.string().trim().max(20).optional().transform((v) => v || null),
  subject: optional(190),
  message: trimmed(3000, 'Message'),
});

const money = z.coerce.number().min(0, 'Must be zero or more').max(10_000_000);
const flag = z.coerce.boolean().optional().default(false);

export const productSchema = z
  .object({
    name: trimmed(190, 'Product name'),
    slug: z.string().trim().max(210).optional().nullable(),
    sku: trimmed(64, 'SKU'),
    short_description: optional(500),
    description: z.string().max(20000).optional().nullable(),
    price: money.refine((v) => v > 0, 'Price must be greater than zero'),
    sale_price: z.union([money, z.literal(''), z.null()]).optional().transform((v) => (v === '' || v == null || v === 0 ? null : v)),
    status: z.enum(['active', 'inactive']),
    is_featured: flag,
    is_best_seller: flag,
    is_new_arrival: flag,
    low_stock_threshold: z.coerce.number().int().min(0).max(10000).default(5),
    seo_title: optional(190),
    seo_description: optional(300),
    category_ids: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one category'),
    images: z
      .array(z.object({ url: z.string().min(1).max(255), alt: optional(190) }))
      .max(12, 'Maximum 12 images'),
    variants: z
      .array(
        z.object({
          id: z.coerce.number().int().positive().optional().nullable(),
          size: optional(30),
          color: optional(40),
          color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable().or(z.literal('').transform(() => null)),
          sku: optional(80),
          price_adjustment: z.coerce.number().min(-1_000_000).max(1_000_000).default(0),
          stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(1_000_000),
          status: z.enum(['active', 'inactive']).default('active'),
        })
      )
      .min(1, 'Add at least one variant'),
  })
  .refine((d) => d.sale_price == null || d.sale_price < d.price, { message: 'Sale price must be lower than the regular price', path: ['sale_price'] });

export const categorySchema = z.object({
  name: trimmed(120, 'Name'),
  menu_label: optional(60),
  slug: z.string().trim().max(140).optional().nullable(),
  parent_id: z.union([z.coerce.number().int().positive(), z.literal(''), z.null()]).optional().transform((v) => v || null),
  description: z.string().max(5000).optional().nullable(),
  image: optional(255),
  status: z.enum(['active', 'inactive']),
  show_in_menu: flag,
  show_on_home: flag,
  sort_order: z.coerce.number().int().default(0),
  seo_title: optional(190),
  seo_description: optional(300),
});

export const couponSchema = z.object({
  code: trimmed(40, 'Code').transform((v) => v.toUpperCase()).refine((v) => /^[A-Z0-9_-]+$/.test(v), 'Use letters, numbers, - or _ only'),
  description: optional(255),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive('Value must be positive'),
  min_order: z.coerce.number().min(0).default(0),
  max_discount: z.union([z.coerce.number().positive(), z.literal(''), z.null()]).optional().transform((v) => v || null),
  usage_limit: z.union([z.coerce.number().int().positive(), z.literal(''), z.null()]).optional().transform((v) => v || null),
  per_customer_limit: z.union([z.coerce.number().int().positive(), z.literal(''), z.null()]).optional().transform((v) => v || null),
  starts_at: z.string().optional().nullable().transform((v) => v || null),
  expires_at: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['active', 'inactive']),
}).refine((d) => d.type !== 'percent' || d.value <= 100, { message: 'Percentage cannot exceed 100', path: ['value'] });

/** Coupon form values → Prisma data (datetime-local strings become Dates). */
export function couponData(d) {
  return { ...d, starts_at: d.starts_at ? new Date(d.starts_at) : null, expires_at: d.expires_at ? new Date(d.expires_at) : null };
}

export const bannerSchema = z.object({
  placement: z.enum(['hero', 'promo']),
  badge: optional(60),
  title: trimmed(120, 'Title'),
  highlight: optional(120),
  subtitle: optional(190),
  description: optional(300),
  offer_text: optional(60),
  offer_highlight: optional(60),
  button_text: optional(60),
  button_link: optional(255),
  image: trimmed(255, 'Image'),
  theme: z.enum(['light', 'dark']),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive']),
});

export const testimonialSchema = z.object({
  name: trimmed(120, 'Name'),
  quote: trimmed(400, 'Quote'),
  avatar: optional(255),
  rating: z.coerce.number().int().min(1).max(5),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive']),
});
