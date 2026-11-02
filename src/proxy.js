import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function valid(token, typ) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return payload.typ === typ;
  } catch {
    return false;
  }
}

// Fast redirect for unauthenticated visits. Every page and API also checks
// the session itself, so this is a convenience layer, not the only guard.
export async function proxy(req) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!(await valid(req.cookies.get('ps_admin')?.value, 'admin'))) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
  }
  if (pathname.startsWith('/account') || pathname === '/wishlist') {
    if (!(await valid(req.cookies.get('ps_session')?.value, 'customer'))) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/account/:path*', '/wishlist'] };
