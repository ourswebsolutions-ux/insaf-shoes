import 'server-only';
import { redirect } from 'next/navigation';
import { adminCan, getAdmin } from './auth';

/** For admin pages: ensures a logged-in admin with access to `area`. */
export async function pageAdmin(area) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  if (area && !adminCan(admin, area)) redirect('/admin?denied=1');
  return admin;
}

export function pageParams(sp, defaults = {}) {
  return {
    q: String(sp.q || '').trim().slice(0, 100),
    page: Math.max(1, Number(sp.page) || 1),
    ...Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, sp[k] ?? v])),
  };
}
