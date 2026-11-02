import Icon from '@/components/Icon';

export default function Stars({ value = 0, size = 14 }) {
  const v = Number(value) || 0;
  return (
    <span className="stars" aria-label={`Rated ${v.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i + 1));
        if (fill >= 0.75) return <Icon key={i} name="starFill" size={size} />;
        if (fill >= 0.25)
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon name="starFill" size={size} className="off" />
              <span style={{ position: 'absolute', inset: 0, width: '50%', overflow: 'hidden', display: 'inline-flex' }}>
                <Icon name="starFill" size={size} />
              </span>
            </span>
          );
        return <Icon key={i} name="starFill" size={size} className="off" />;
      })}
    </span>
  );
}
