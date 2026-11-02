'use client';

import { useMemo, useState } from 'react';

function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

/** Size/colour selection state for a product's variants. */
export function useVariantSelection(variants) {
  const sizes = useMemo(() => sortSizes([...new Set(variants.map((v) => v.size).filter(Boolean))]), [variants]);
  const colors = useMemo(() => {
    const map = new Map();
    for (const v of variants) if (v.color && !map.has(v.color)) map.set(v.color, v.color_hex);
    return [...map].map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState(() => {
    if (colors.length === 1) return colors[0].name;
    // Preselect the first colour that has stock so sizes show real availability.
    const first = variants.find((v) => v.stock > 0 && v.color);
    return colors.length ? first?.color || colors[0].name : null;
  });

  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;

  const variant = useMemo(() => {
    if ((needsSize && !size) || (needsColor && !color)) return null;
    return variants.find((v) => (v.size || null) === (needsSize ? size : null) && (v.color || null) === (needsColor ? color : null)) || null;
  }, [variants, size, color, needsSize, needsColor]);

  const sizeAvailable = (s) => variants.some((v) => v.size === s && (!needsColor || !color || v.color === color) && v.stock > 0);
  const colorAvailable = (c) => variants.some((v) => v.color === c && v.stock > 0);

  const missing = needsSize && !size ? 'Please select a size.' : needsColor && !color ? 'Please select a colour.' : null;
  const totalStock = variants.reduce((s, v) => s + Math.max(0, v.stock), 0);

  return { sizes, colors, size, setSize, color, setColor, variant, sizeAvailable, colorAvailable, missing, totalStock };
}

export default function VariantOptions({ sel }) {
  return (
    <>
      {sel.colors.length > 0 && (
        <div className="opt-group">
          <div className="opt-group__head">
            Colour: <span>{sel.color || 'Select'}</span>
          </div>
          <div className="swatches" role="radiogroup" aria-label="Colour">
            {sel.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={sel.color === c.name}
                aria-label={c.name}
                title={c.name}
                className={`swatch ${sel.color === c.name ? 'is-active' : ''}`}
                style={{ background: c.hex || '#ccc' }}
                disabled={!sel.colorAvailable(c.name)}
                onClick={() => {
                  sel.setColor(c.name);
                  if (sel.size && !sel.sizeAvailable(sel.size)) sel.setSize(null);
                }}
              />
            ))}
          </div>
        </div>
      )}
      {sel.sizes.length > 0 && (
        <div className="opt-group">
          <div className="opt-group__head">
            Size (EU): <span>{sel.size || 'Select'}</span>
          </div>
          <div className="size-grid" role="radiogroup" aria-label="Size">
            {sel.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={sel.size === s}
                className={`size-opt ${sel.size === s ? 'is-active' : ''}`}
                disabled={!sel.sizeAvailable(s)}
                onClick={() => sel.setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
