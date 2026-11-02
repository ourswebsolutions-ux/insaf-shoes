'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/client-api';

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children, width }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { maxWidth: width } : undefined}>
        <button className="modal__close" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        <div className="panel__head"><h3>{title}</h3></div>
        <div className="panel__body">{children}</div>
      </div>
    </div>
  );
}

/** Runs an API mutation, shows errors, and refreshes server data on success. */
export function useMutation() {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, error: null, message: null });
  async function run(url, opts, { refresh = true, success } = {}) {
    setState({ busy: true, error: null, message: null });
    try {
      const res = await api(url, opts);
      setState({ busy: false, error: null, message: success || res.message || null });
      if (refresh) router.refresh();
      return res;
    } catch (e) {
      setState({ busy: false, error: e.message, details: e.details, message: null });
      throw e;
    }
  }
  return [state, run, setState];
}

export function DeleteButton({ url, confirmText = 'Delete this item? This cannot be undone.', label, onDone }) {
  const [state, run] = useMutation();
  return (
    <button
      type="button"
      className={label ? 'btn btn--danger btn--sm' : 'icon-action icon-action--danger'}
      title="Delete"
      aria-label="Delete"
      disabled={state.busy}
      onClick={async () => {
        if (!confirm(confirmText)) return;
        try {
          await run(url, { method: 'DELETE' });
          onDone?.();
        } catch (e) {
          alert(e.message);
        }
      }}
    >
      <Icon name="trash" size={16} />
      {label}
    </button>
  );
}

export function FormMessage({ state }) {
  if (state.error) return <p className="form-error">{state.error}</p>;
  if (state.message) return <p className="form-success">{state.message}</p>;
  return null;
}

async function uploadFiles(files, folder) {
  const fd = new FormData();
  for (const f of files) fd.append('file', f);
  fd.append('folder', folder);
  return (await api('/api/admin/upload', { method: 'POST', body: fd })).urls;
}

/** Multi-image uploader with reordering. value: [{url, alt}] */
export function ImageUploader({ value, onChange, folder = 'products', max = 12 }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState(null);

  async function add(files) {
    const list = [...files].slice(0, max - value.length);
    if (!list.length) return;
    setBusy(true);
    setError(null);
    try {
      const urls = await uploadFiles(list, folder);
      onChange([...value, ...urls.map((url) => ({ url, alt: '' }))]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const move = (i, d) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="uploader">
        {value.map((img, i) => (
          <div className="uploader__item" key={img.url + i}>
            <Image src={img.url} alt="" fill sizes="140px" />
            {i === 0 && <span className="badge primary">Main</span>}
            <div className="tools">
              <button type="button" onClick={() => move(i, -1)} aria-label="Move left" disabled={i === 0}><Icon name="chevronLeft" size={14} /></button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove image"><Icon name="trash" size={14} /></button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move right" disabled={i === value.length - 1}><Icon name="chevronRight" size={14} /></button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <div
            className={`uploader__drop ${over ? 'is-over' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
          >
            {busy ? <span className="spinner" /> : <span><Icon name="upload" size={22} /><br />Upload images<br /><small>JPG, PNG, WebP · max 8MB</small></span>}
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {error && <p className="field error" style={{ marginTop: 6 }}>{error}</p>}
    </div>
  );
}

/** Single image field. value: url string */
export function SingleImage({ value, onChange, folder }) {
  return (
    <div className="uploader--single">
      <ImageUploader value={value ? [{ url: value }] : []} onChange={(v) => onChange(v[0]?.url || '')} folder={folder} max={1} />
    </div>
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({ title, children, confirmLabel = 'Delete', busy, error, onConfirm, onClose, danger = true }) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose} width={520}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>{children}</div>
        {error && <p className="form-error">{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${danger ? 'btn--danger-solid' : 'btn--primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? <span className="spinner" /> : danger ? <Icon name="trash" size={16} /> : null} {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
