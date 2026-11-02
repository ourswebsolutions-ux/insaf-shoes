'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/client-api';
import { discountPercent } from '@/lib/format';
import { ImageUploader, Toggle } from './ui';

const PRESET_COLORS = {
  Black: '#1d1d1d', White: '#f5f5f5', Brown: '#7a4a24', Tan: '#b07a45', Beige: '#d9c3a5', Grey: '#9aa0a6', Navy: '#1f2a4d',
  Red: '#c62828', Maroon: '#6d1f2b', Pink: '#f2a9bf', Blue: '#2f6fb2', Green: '#4f8a3a', Olive: '#5c6440', Cream: '#efe6d8',
  Nude: '#e3bc9a', Silver: '#c0c0c0', Golden: '#c9a227', Mustard: '#d4a017', Multi: '#8e7cc3',
};
const SIZE_PRESETS = {
  'Men (EU 39–45)': '39, 40, 41, 42, 43, 44, 45',
  'Women (EU 36–41)': '36, 37, 38, 39, 40, 41',
  'Kids (EU 24–34)': '24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34',
  'Letters (S–XL)': 'S, M, L, XL',
};

const key = (size, color) => `${size || ''}|${color || ''}`;

export default function ProductForm({ initial, categories }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [p, setP] = useState(initial);
  const [sizesText, setSizesText] = useState(() => [...new Set(initial.variants.map((v) => v.size).filter(Boolean))].join(', '));
  const [colors, setColors] = useState(() => {
    const m = new Map();
    for (const v of initial.variants) if (v.color && !m.has(v.color)) m.set(v.color, v.color_hex || PRESET_COLORS[v.color] || '#888888');
    return [...m].map(([name, hex]) => ({ name, hex }));
  });
  const [newColor, setNewColor] = useState('');
  const [defaultStock, setDefaultStock] = useState(10);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [extraColumns, setExtraColumns] = useState(() => initial.variants.some((v) => Number(v.price_adjustment)));

  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const off = discountPercent(Number(p.price), Number(p.sale_price));
  const totalStock = p.variants.filter((v) => v.status === 'active').reduce((s, v) => s + (Number(v.stock) || 0), 0);

  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id);
    return roots.map((r) => ({ ...r, children: categories.filter((c) => c.parent_id === r.id) }));
  }, [categories]);

  function toggleCategory(id, parentId) {
    const has = p.category_ids.includes(id);
    let next = has ? p.category_ids.filter((x) => x !== id) : [...p.category_ids, id];
    if (!has && parentId && !next.includes(parentId)) next.push(parentId);
    set('category_ids', next);
  }

  function generate() {
    const sizes = sizesText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const sizeList = sizes.length ? sizes : [null];
    const colorList = colors.length ? colors : [null];
    const existing = new Map(p.variants.map((v) => [key(v.size, v.color), v]));
    const next = [];
    for (const c of colorList)
      for (const s of sizeList) {
        const prev = existing.get(key(s, c?.name));
        const auto = [p.sku, c?.name?.slice(0, 3).toUpperCase(), s].filter(Boolean).join('-');
        next.push(prev ? { ...prev, color_hex: c?.hex ?? prev.color_hex } : { size: s, color: c?.name || null, color_hex: c?.hex || null, sku: auto, stock: defaultStock, price_adjustment: 0, status: 'active' });
      }
    set('variants', next);
  }

  function addColor(name) {
    const n = name.trim();
    if (!n || colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    setColors([...colors, { name: n, hex: PRESET_COLORS[n] || '#888888' }]);
    setNewColor('');
  }

  const updateVariant = (i, k, v) => set('variants', p.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const body = {
        ...p,
        price: Number(p.price),
        sale_price: p.sale_price === '' || p.sale_price == null ? null : Number(p.sale_price),
        variants: p.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0, price_adjustment: Number(v.price_adjustment) || 0 })),
      };
      const res = await api(isNew ? '/api/admin/products' : `/api/admin/products/${p.id}`, { method: isNew ? 'POST' : 'PUT', body });
      if (isNew) {
        router.push(`/admin/products/${res.id}?created=1`);
      } else {
        setSaved(res.message);
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
      if (err.details) setErrors(err.details);
      document.querySelector('.admin-main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  const err = (k) => errors[k] && <span className="error">{errors[k]}</span>;

  return (
    <form onSubmit={save} noValidate>
      <div className="page-bar" style={{ marginBottom: 20 }}>
        <div>
          <Link href="/admin/products" className="link" style={{ fontSize: 13 }}>← All products</Link>
          <h1 style={{ marginTop: 4 }}>{isNew ? 'Add Product' : `Edit: ${initial.name}`}</h1>
          <p>Fill in the details below and click Save. Fields marked * are required.</p>
        </div>
        <div className="page-bar__actions">
          {!isNew && <a href={`/product/${initial.slug}`} target="_blank" className="btn btn--outline btn--sm"><Icon name="eye" size={16} /> View in store</a>}
          <button className="btn btn--primary btn--sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {saved && <p className="form-success" style={{ marginBottom: 16 }}>{saved}</p>}

      <div className="form-layout">
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="panel">
            <div className="panel__head"><h3>1. Product details</h3></div>
            <div className="panel__body form-grid">
              <div className="field span-2">
                <label htmlFor="pf-name">Product name *</label>
                <input id="pf-name" className="input" value={p.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
                {err('name')}
              </div>
              <div className="field">
                <label htmlFor="pf-sku">Product code *</label>
                <input id="pf-sku" className="input" value={p.sku} onChange={(e) => set('sku', e.target.value)} aria-invalid={!!errors.sku} />
                {err('sku') || <span className="hint">Your own code for this product. Must be different for every product.</span>}
              </div>
              <div className="field span-2">
                <label htmlFor="pf-short">Short description</label>
                <textarea id="pf-short" className="textarea" style={{ minHeight: 70 }} maxLength={500} value={p.short_description || ''} onChange={(e) => set('short_description', e.target.value)} />
              </div>
              <div className="field span-2">
                <label htmlFor="pf-desc">Full description</label>
                <textarea id="pf-desc" className="textarea" style={{ minHeight: 160 }} value={p.description || ''} onChange={(e) => set('description', e.target.value)} />
                <span className="hint">Separate paragraphs with a blank line.</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head"><h3>2. Photos</h3><span className="muted" style={{ fontSize: 13 }}>The first photo is shown in the shop. Use the arrows to reorder.</span></div>
            <div className="panel__body">
              <ImageUploader value={p.images} onChange={(v) => set('images', v)} folder="products" />
              {err('images')}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head"><h3>3. Price</h3></div>
            <div className="panel__body form-grid">
              <div className="field">
                <label htmlFor="pf-price">Price (Rs.) *</label>
                <input id="pf-price" className="input" type="number" min="0" value={p.price} onChange={(e) => set('price', e.target.value)} aria-invalid={!!errors.price} />
                {err('price')}
              </div>
              <div className="field">
                <label htmlFor="pf-sale">Discounted price (Rs.)</label>
                <input id="pf-sale" className="input" type="number" min="0" value={p.sale_price ?? ''} placeholder="Leave empty if no discount" onChange={(e) => set('sale_price', e.target.value)} aria-invalid={!!errors.sale_price} />
                {err('sale_price') || (off > 0 ? <span className="hint">Customers will see a “-{off}%” badge.</span> : <span className="hint">Must be lower than the price.</span>)}
              </div>
              <div className="field span-2">
                <span className="label">Quick discount – click to set the discounted price</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[10, 15, 20, 25, 30, 40, 50].map((d) => (
                    <button key={d} type="button" className="btn btn--ghost btn--sm" onClick={() => set('sale_price', Math.round((Number(p.price) * (100 - d)) / 100))} disabled={!Number(p.price)}>
                      -{d}%
                    </button>
                  ))}
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => set('sale_price', '')}>No discount</button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head"><h3>4. Sizes, colours &amp; stock</h3><span className="muted" style={{ fontSize: 13 }}>Total in stock: <b>{totalStock}</b></span></div>
            <div className="panel__body" style={{ display: 'grid', gap: 18 }}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pf-sizes">Sizes</label>
                  <input id="pf-sizes" className="input" value={sizesText} onChange={(e) => setSizesText(e.target.value)} placeholder="e.g. 39, 40, 41 (leave empty if no sizes)" />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {Object.entries(SIZE_PRESETS).map(([k, v]) => (
                      <button key={k} type="button" className="chip" style={{ height: 28, fontSize: 12 }} onClick={() => setSizesText(v)}>{k}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="label">Colours</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {colors.map((c, i) => (
                      <span key={c.name} className="chip" style={{ height: 32, paddingRight: 6 }}>
                        <input type="color" value={c.hex} onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} style={{ width: 20, height: 20, border: 0, padding: 0, background: 'none' }} aria-label={`${c.name} colour`} />
                        {c.name}
                        <button type="button" onClick={() => setColors(colors.filter((_, j) => j !== i))} style={{ border: 0, background: 'none', padding: 2 }} aria-label={`Remove ${c.name}`}><Icon name="x" size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" list="pf-color-list" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add colour (e.g. Black)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(newColor); } }} style={{ height: 38 }} />
                    <datalist id="pf-color-list">{Object.keys(PRESET_COLORS).map((c) => <option key={c} value={c} />)}</datalist>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => addColor(newColor)}>Add</button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
                <div className="field" style={{ width: 160 }}>
                  <label htmlFor="pf-defstock">Pieces of each new size</label>
                  <input id="pf-defstock" className="input" type="number" min="0" value={defaultStock} onChange={(e) => setDefaultStock(Number(e.target.value) || 0)} style={{ height: 38 }} />
                </div>
                <button type="button" className="btn btn--primary btn--sm" onClick={generate}><Icon name="grid" size={16} /> Create size &amp; colour list</button>
                <span className="hint muted" style={{ fontSize: 12.5 }}>Type sizes and colours above, then click this. Stock you already entered is kept. Then type how many pieces you have of each.</span>
              </div>
              {err('variants')}
              <div className="table-wrap">
                <table className="table variant-table">
                  <thead><tr><th>Size</th><th>Colour</th>{extraColumns && <th>Code</th>}<th>Pieces in stock</th>{extraColumns && <th>Extra price</th>}<th>Available</th><th></th></tr></thead>
                  <tbody>
                    {p.variants.map((v, i) => (
                      <tr key={i}>
                        <td><input className="input" style={{ width: 70 }} value={v.size || ''} onChange={(e) => updateVariant(i, 'size', e.target.value || null)} /></td>
                        <td className="nowrap">{v.color_hex && <span className="swatch-dot" style={{ background: v.color_hex }} />}<input className="input" style={{ width: 100, display: 'inline-block' }} value={v.color || ''} onChange={(e) => updateVariant(i, 'color', e.target.value || null)} /></td>
                        {extraColumns && <td><input className="input" style={{ width: 150 }} value={v.sku || ''} onChange={(e) => updateVariant(i, 'sku', e.target.value)} aria-label="Code" /></td>}
                        <td><input className="input" type="number" min="0" style={{ width: 80 }} value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} /></td>
                        {extraColumns && <td><input className="input" type="number" style={{ width: 90 }} value={v.price_adjustment || 0} onChange={(e) => updateVariant(i, 'price_adjustment', e.target.value)} aria-label="Extra price" /></td>}
                        <td><Toggle checked={v.status === 'active'} onChange={(on) => updateVariant(i, 'status', on ? 'active' : 'inactive')} /></td>
                        <td><button type="button" className="icon-action icon-action--danger" onClick={() => set('variants', p.variants.filter((_, j) => j !== i))} aria-label="Remove variant" disabled={p.variants.length === 1}><Icon name="trash" size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => set('variants', [...p.variants, { size: null, color: null, color_hex: null, sku: '', stock: defaultStock, price_adjustment: 0, status: 'active' }])}>
                  <Icon name="plus" size={15} /> Add one more row
                </button>
                <label className="checkbox" style={{ marginLeft: 16, fontSize: 13 }}>
                  <input type="checkbox" checked={extraColumns} onChange={(e) => setExtraColumns(e.target.checked)} /> Show codes and different prices per size
                </label>
              </div>
            </div>
          </section>

          <details className="panel more">
            <summary><Icon name="chevronDown" size={16} /> More options (optional – you can skip this)</summary>
            <div className="panel__body form-grid">
              <div className="field span-2">
                <label htmlFor="pf-slug">Web address</label>
                <input id="pf-slug" className="input" value={p.slug || ''} placeholder="Made automatically from the product name" onChange={(e) => set('slug', e.target.value)} />
                <span className="hint">The end of the product’s page link, e.g. punjabshop.shop/product/<b>{p.slug || 'black-leather-loafers'}</b></span>
              </div>
              <div className="field span-2">
                <label htmlFor="pf-seot">Title shown on Google</label>
                <input id="pf-seot" className="input" maxLength={190} value={p.seo_title || ''} placeholder={p.name} onChange={(e) => set('seo_title', e.target.value)} />
              </div>
              <div className="field span-2">
                <label htmlFor="pf-seod">Description shown on Google</label>
                <textarea id="pf-seod" className="textarea" style={{ minHeight: 70 }} maxLength={300} value={p.seo_description || ''} placeholder={p.short_description || ''} onChange={(e) => set('seo_description', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pf-low">Warn me when stock falls to</label>
                <input id="pf-low" className="input" type="number" min="0" value={p.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
              </div>
            </div>
          </details>
        </div>

        <aside>
          <section className="panel">
            <div className="panel__head"><h3>Show in shop</h3></div>
            <div className="panel__body" style={{ display: 'grid', gap: 14 }}>
              <Toggle checked={p.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label={p.status === 'active' ? 'Customers can see and buy it' : 'Hidden – customers cannot see it'} />
              <Toggle checked={p.is_featured} onChange={(v) => set('is_featured', v)} label="Show in “Featured” on the homepage" />
              <Toggle checked={p.is_best_seller} onChange={(v) => set('is_best_seller', v)} label="Show in “Best Selling” on the homepage" />
              <Toggle checked={p.is_new_arrival} onChange={(v) => set('is_new_arrival', v)} label="Show in “New Arrivals”" />
            </div>
          </section>
          <section className="panel">
            <div className="panel__head"><h3>Categories *</h3><Link href="/admin/categories" className="link" style={{ fontSize: 13 }}>Add new</Link></div>
            <div className="panel__body">
              <div className="cat-checks">
                {tree.map((c) => (
                  <div key={c.id}>
                    <label className="checkbox"><input type="checkbox" checked={p.category_ids.includes(c.id)} onChange={() => toggleCategory(c.id)} /> {c.name}</label>
                    {c.children.map((s) => (
                      <label key={s.id} className="checkbox sub" style={{ marginTop: 6 }}><input type="checkbox" checked={p.category_ids.includes(s.id)} onChange={() => toggleCategory(s.id, c.id)} /> {s.name}</label>
                    ))}
                  </div>
                ))}
              </div>
              <span className="hint muted" style={{ fontSize: 12.5, display: 'block', marginTop: 8 }}>Tick every category this product should appear in.</span>
              {err('category_ids')}
            </div>
          </section>
        </aside>
      </div>
      <div className="sticky-save">
        <Link href="/admin/products" className="btn btn--ghost">Cancel</Link>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Save product' : 'Save changes'}</button>
      </div>
    </form>
  );
}
