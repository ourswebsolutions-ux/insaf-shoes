'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';

function Offer({ text, highlight }) {
  if (!text && !highlight) return null;
  return (
    <div className="hero__offer" aria-label={`${text || ''} ${highlight || ''}`}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M10 28c30-16 98-22 182-14l-6 18c8 6 8 14 2 20 8 10 6 22-4 30 4 8 0 16-8 20-50 10-112 12-166 4l4-14c-8-6-10-16-2-24-8-10-6-22 4-28-6-4-6-8-6-12z"
          fill="#17501b"
        />
        <path d="M18 34c40-10 100-14 160-10" stroke="#2a7d2c" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".6" />
      </svg>
      <span>
        {text && <small>{text}</small>}
        {highlight && <strong>{highlight}</strong>}
      </span>
    </div>
  );
}

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const touch = useRef(null);
  const count = slides.length;

  const go = useCallback((i) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(timer.current);
  }, [count, index]);

  if (!count) return null;

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="hero__track">
        {slides.map((s, i) => (
          <div key={s.id} className={`hero__slide ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
            <div className="hero__media">
              <Image src={s.image} alt="" fill priority={i === 0} sizes="(max-width: 680px) 100vw, 66vw" />
            </div>
            <div className="container" style={{ height: '100%' }}>
              <div className="hero__content">
                {s.badge && (
                  <span className="hero__badge">
                    {s.badge.match(/^(.*?)(Shop)$/) ? (
                      <>
                        {s.badge.replace(/Shop$/, '')}
                        <em>Shop</em>
                      </>
                    ) : (
                      s.badge
                    )}
                  </span>
                )}
                {i === 0 ? (
                  <h1 className="hero__title">
                    {s.title} {s.highlight && <em>{s.highlight}</em>}
                  </h1>
                ) : (
                  <h2 className="hero__title">
                    {s.title} {s.highlight && <em>{s.highlight}</em>}
                  </h2>
                )}
                {s.subtitle && <p className="hero__subtitle">{s.subtitle}</p>}
                {s.description && <p className="hero__desc">{s.description}</p>}
                {s.button_text && s.button_link && (
                  <div className="hero__cta">
                    <Link href={s.button_link} className="btn btn--primary" tabIndex={i === index ? 0 : -1}>
                      {s.button_text} <Icon name="arrowRight" size={18} className="arrow" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <Offer text={s.offer_text} highlight={s.offer_highlight} />
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          <button className="hero__arrow hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous slide">
            <Icon name="chevronLeft" />
          </button>
          <button className="hero__arrow hero__arrow--next" onClick={() => go(index + 1)} aria-label="Next slide">
            <Icon name="chevronRight" />
          </button>
          <div className="container" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <div className="hero__dots" style={{ position: 'relative', left: 0, transform: 'none', bottom: 16 }}>
              {slides.map((s, i) => (
                <button key={s.id} className={`dot ${i === index ? 'is-active' : ''}`} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
