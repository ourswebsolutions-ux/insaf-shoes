'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';

export default function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const touch = useRef(null);
  const img = images[active];
  const go = (d) => setActive((i) => (i + d + images.length) % images.length);

  if (!images.length) return <div className="gallery__main skeleton" />;

  return (
    <div className="gallery">
      <div className="gallery__thumbs">
        {images.map((im, i) => (
          <button key={im.id} type="button" className={`gallery__thumb ${i === active ? 'is-active' : ''}`} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}>
            <Image src={im.url} alt="" fill sizes="80px" />
          </button>
        ))}
      </div>
      <div
        className={`gallery__main ${zoom ? 'is-zoom' : ''}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <Image src={img.url} alt={img.alt || name} fill priority sizes="(max-width: 1080px) 100vw, 600px" style={zoom ? { transformOrigin: zoom } : undefined} />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label="Previous image">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label="Next image">
              <Icon name="chevronRight" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
