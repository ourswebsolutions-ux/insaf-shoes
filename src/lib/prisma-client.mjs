// Shared Prisma Client factory, used by the app (src/lib/db.js) and by prisma/seed.mjs.
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function connectionConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set. See .env.example.');
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    // Store and read all DATETIME values as UTC, matching how Prisma treats them.
    initSql: "SET time_zone = '+00:00'",
  };
}

/** Converts Prisma Decimal and BigInt values to plain numbers (recursively). */
export function toPlain(value) {
  if (value == null || typeof value !== 'object') return typeof value === 'bigint' ? Number(value) : value;
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber();
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(toPlain);
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
  return out;
}

export function createPrisma() {
  const client = new PrismaClient({
    adapter: new PrismaMariaDb(connectionConfig()),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return toPlain(await query(args));
        },
      },
    },
  });
}
