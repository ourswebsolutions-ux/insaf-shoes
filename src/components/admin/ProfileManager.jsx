'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { DeleteButton, FormMessage, useMutation } from './ui';

const ROLE_HELP = {
  super_admin: 'Full access including settings and admin users',
  manager: 'Catalog, orders, customers, marketing and content',
  staff: 'Orders, customers and reviews only',
};

function AdminRow({ a, isMe }) {
  const [role, setRole] = useState(a.role);
  const [status, setStatus] = useState(a.status);
  const [state, run] = useMutation();
  const dirty = role !== a.role || status !== a.status;
  return (
    <tr>
      <td><b>{a.name}</b>{isMe && <span className="muted"> (you)</span>}<br /><small className="muted">{a.email}</small></td>
      <td>
        <select className="select" style={{ height: 36, width: 150 }} value={role} disabled={isMe} onChange={(e) => setRole(e.target.value)}>
          {Object.keys(ROLE_HELP).map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </td>
      <td>
        <select className="select" style={{ height: 36, width: 120 }} value={status} disabled={isMe} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option><option value="disabled">disabled</option>
        </select>
      </td>
      <td className="muted nowrap">{a.last_login_at ? formatDate(a.last_login_at, true) : 'Never'}</td>
      <td>
        {!isMe && (
          <div className="row-actions">
            {dirty && <button className="btn btn--primary btn--sm" disabled={state.busy} onClick={() => run(`/api/admin/admins/${a.id}`, { method: 'PATCH', body: { role, status } }).catch((e) => alert(e.message))}>Save</button>}
            <DeleteButton url={`/api/admin/admins/${a.id}`} />
          </div>
        )}
      </td>
    </tr>
  );
}

export default function ProfileManager({ me, admins }) {
  const [p, setP] = useState({ name: me.name, email: me.email, current_password: '', new_password: '' });
  const [state, run] = useMutation();
  const [n, setN] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [nState, runN] = useMutation();

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <form className="panel" onSubmit={async (e) => { e.preventDefault(); await run('/api/admin/profile', { method: 'PUT', body: p }).catch(() => {}); setP((x) => ({ ...x, current_password: '', new_password: '' })); }}>
        <div className="panel__head"><h3>My Profile</h3><span className="status status--active">{me.role.replace('_', ' ')}</span></div>
        <div className="panel__body form-grid">
          <div className="field"><label>Name</label><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input className="input" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
          <div className="field"><label>New password</label><input className="input" type="password" autoComplete="new-password" value={p.new_password} onChange={(e) => setP({ ...p, new_password: e.target.value })} placeholder="Leave blank to keep" /></div>
          <div className="field"><label>Current password</label><input className="input" type="password" autoComplete="current-password" value={p.current_password} onChange={(e) => setP({ ...p, current_password: e.target.value })} placeholder="Required to change email/password" /></div>
          <div className="span-2"><FormMessage state={state} /></div>
          <div className="span-2"><button className="btn btn--primary" disabled={state.busy}>Save profile</button></div>
        </div>
      </form>

      {admins && (
        <section className="panel">
          <div className="panel__head"><h3>Admin Users &amp; Roles</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Admin</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead>
              <tbody>{admins.map((a) => <AdminRow key={a.id} a={a} isMe={a.id === me.id} />)}</tbody>
            </table>
          </div>
          <form className="panel__body form-grid" style={{ borderTop: '1px solid var(--line-2)' }} onSubmit={async (e) => { e.preventDefault(); try { await runN('/api/admin/admins', { method: 'POST', body: n }); setN({ name: '', email: '', password: '', role: 'staff' }); } catch {} }}>
            <h4 className="span-2">Add admin user</h4>
            <div className="field"><label>Name</label><input className="input" required value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" required value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} /></div>
            <div className="field"><label>Temporary password</label><input className="input" type="password" required minLength={8} autoComplete="new-password" value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} /></div>
            <div className="field">
              <label>Role</label>
              <select className="select" value={n.role} onChange={(e) => setN({ ...n, role: e.target.value })}>
                {Object.keys(ROLE_HELP).map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <span className="hint">{ROLE_HELP[n.role]}</span>
            </div>
            <div className="span-2"><FormMessage state={nState} /></div>
            <div className="span-2"><button className="btn btn--primary" disabled={nState.busy}>Create admin</button></div>
          </form>
        </section>
      )}
    </div>
  );
}
