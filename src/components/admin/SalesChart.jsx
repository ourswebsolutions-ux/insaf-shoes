'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';

/** Single-series daily revenue bars with a per-bar hover tooltip. */
export default function SalesChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = 240;
  const pad = { l: 56, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const nice = (() => {
    const p = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / p) * p;
  })();
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const step = iw / data.length;
  const bw = Math.max(3, Math.min(18, step - 4));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
  const short = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <div className="chart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily revenue for the last 30 days">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / nice) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--line-2)" strokeWidth="1" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{short(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.revenue / nice) * ih;
          const x = pad.l + i * step + (step - bw) / 2;
          const y = pad.t + ih - h;
          const r = Math.min(4, bw / 2, h);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + i * step} y={pad.t} width={step} height={ih} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${pad.t + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${pad.t + ih} Z`}
                  fill="var(--green-600)"
                  opacity={hover == null || hover === i ? 1 : 0.45}
                />
              )}
              {(i % 5 === 0 || i === data.length - 1) && (
                <text x={pad.l + i * step + step / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="var(--line)" />
      </svg>
      {hover != null && (
        <div className="chart__tip" style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%`, top: `${((pad.t + ih - (data[hover].revenue / nice) * ih) / H) * 100}%` }}>
          <b>{formatPrice(data[hover].revenue)}</b>
          {data[hover].label} · {data[hover].orders} orders
        </div>
      )}
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <tbody>{data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.revenue}</td><td>{d.orders}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
