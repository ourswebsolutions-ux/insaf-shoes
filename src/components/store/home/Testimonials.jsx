'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Stars from '../Stars';

function usePerView() {
  const [n, setN] = useState(3);
  useEffect(() => {
    const calc = () => setN(window.innerWidth <= 680 ? 1 : window.innerWidth <= 900 ? 2 : 3);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return n;
}

export default function Testimonials({ items }) {
  const perView = usePerView();
  const pages = Math.max(1, Math.ceil(items.length / perView));
  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [perView]);
  useEffect(() => {
    if (pages < 2) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pages), 7000);
    return () => clearInterval(t);
  }, [pages, page]);

  return (
    <div>
      <div className="tm-viewport" style={{ margin: '0 -10px' }}>
        <div className="tm-track" style={{ transform: `translateX(-${page * 100}%)` }}>
          {items.map((t) => (
            <div className="tm-slide" key={t.id}>
              <figure className="tm-card" style={{ margin: 0 }}>
                <div className="avatar">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="64px" /> : t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <blockquote>“{t.quote}”</blockquote>
                  <cite>– {t.name}</cite>
                  <Stars value={t.rating} size={17} />
                </div>
              </figure>
            </div>
          ))}
        </div>
      </div>
      {pages > 1 && (
        <div className="tm-dots">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={`dot ${i === page ? 'is-active' : ''}`} onClick={() => setPage(i)} aria-label={`Show testimonials page ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
