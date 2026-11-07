import Link from 'next/link';

// Size comes from CSS (.logo__mark, responsive) unless a fixed size is passed.
export function LogoMark({ size }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/logo.png"
      width={size || 52}
      height={size || 52}
      alt=""
      aria-hidden="true"
      className="logo__mark"
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

export default function Logo({ variant = 'dark', tagline = 'Walk in Style', href = '/', name = 'Insaf Shoes' }) {
  // Highlight the last word in gold ("Insaf <Shoes>").
  const split = name.match(/^(.*\s)(\S+)$/);
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
