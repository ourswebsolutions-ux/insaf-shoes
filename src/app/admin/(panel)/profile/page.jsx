import ProfileManager from '@/components/admin/ProfileManager';
import { pageAdmin } from '@/lib/admin';
import { adminCan } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata = { title: 'Admin Profile' };

export default async function ProfileAdmin() {
  const me = await pageAdmin();
  const admins = adminCan(me, 'admins') ? await query('SELECT id, name, email, role, status, last_login_at FROM admins ORDER BY created_at') : null;
  return (
    <>
      <div className="page-bar"><div><h1>Admin Profile</h1><p>Your account details{admins ? ' and admin user access' : ''}.</p></div></div>
      <ProfileManager me={{ id: me.id, name: me.name, email: me.email, role: me.role }} admins={admins && JSON.parse(JSON.stringify(admins))} />
    </>
  );
}
