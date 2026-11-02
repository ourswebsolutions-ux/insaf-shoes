import Link from 'next/link';

export function LogoMark({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ps-bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cb531" />
          <stop offset="1" stopColor="#1f6b20" />
        </linearGradient>
        <linearGradient id="ps-shoe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd84a" />
          <stop offset="1" stopColor="#f2b705" />
        </linearGradient>
      </defs>
      <path d="M23 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#f2b705" strokeWidth="4" strokeLinecap="round" />
      <path d="M13 19h38l4 30a4 4 0 0 1-4 4.5H13A4 4 0 0 1 9 49z" fill="url(#ps-bag)" />
      <path d="M17 26h30" stroke="#ffffff" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M3 47.5c5.5.3 9.5-2.6 13-7.2l5.5 3.8c4 2.4 9.6 3.6 15.6 3.6h11.6c5 0 9.3 2.3 9.3 6.3v2.5H3.6C2.4 56.5 2 55 2 53.4z"
        fill="url(#ps-shoe)"
        stroke="#1f5e1f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 52.5h48" stroke="#1f5e1f" strokeWidth="1.6" />
      <path d="M24 46.5l3-3M29 48l3-3M34 48.6l3-3" stroke="#1f5e1f" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ variant = 'dark', tagline = 'Walk in Style', href = '/', name = 'PunjabShop' }) {
  const split = name.match(/^(.*?)(Shop)$/i);
  return (
    <Link href={href} className={`logo logo--${variant}`} aria-label={`${name} home`}>
      <LogoMark />
      <span className="logo__text">
        <span className="logo__name">
          {split ? (
            <>
              {split[1]}
              <em>{split[2]}</em>
            </>
          ) : (
            name
          )}
        </span>
        {tagline && <span className="logo__tag">{tagline}</span>}
      </span>
    </Link>
  );
}
