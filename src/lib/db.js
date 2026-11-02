import 'server-only';
import { createPrisma, toPlain } from './prisma-client.mjs';

// Reuse one client across hot reloads in development.
export const prisma = globalThis.__punjabPrisma || createPrisma();
if (process.env.NODE_ENV !== 'production') globalThis.__punjabPrisma = prisma;

/**
 * Raw SQL for reporting/listing queries that are clearer in SQL than in the
 * Prisma query API (computed columns, aggregates, dynamic filters).
 * Always pass user input through `params` (? placeholders), never interpolate it.
 */
export async function query(sql, params = [], client = prisma) {
  if (/^\s*(SELECT|WITH|SHOW)\b/i.test(sql)) return toPlain(await client.$queryRawUnsafe(sql, ...params));
  return { affectedRows: await client.$executeRawUnsafe(sql, ...params) };
}

export async function queryOne(sql, params = [], client = prisma) {
  const rows = await query(sql, params, client);
  return rows[0] || null;
}

export default prisma;
