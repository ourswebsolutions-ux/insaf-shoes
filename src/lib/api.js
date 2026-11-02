import 'server-only';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from './errors';

export function ok(data = {}, init) {
  return NextResponse.json(data, init);
}

export function fail(message, status = 400, details) {
  return NextResponse.json({ error: message, details }, { status });
}

// Wraps a route handler with consistent error responses.
export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof AppError) return fail(err.message, err.status, err.details);
      if (err instanceof ZodError) {
        const details = {};
        for (const issue of err.issues) details[issue.path.join('.') || '_'] = issue.message;
        return fail(Object.values(details)[0] || 'Invalid input', 422, details);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') return fail('A record with this value already exists.', 409);
        if (err.code === 'P2025') return fail('Record not found.', 404);
      }
      console.error('[api]', err);
      return fail('Something went wrong. Please try again.', 500);
    }
  };
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new AppError('Invalid request body', 400);
  }
}
