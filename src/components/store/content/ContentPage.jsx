import Link from 'next/link';
import Icon from '@/components/Icon';

export default function ContentPage({ title, intro, children, narrow = true }) {
  return (
    <>
      <section className="page-head">
        <div className="container page-head__inner">
          <nav className="crumbs" aria-label="Breadcrumb" style={{ paddingTop: 0 }}>
            <Link href="/">Home</Link>
            <Icon name="chevronRight" size={14} />
            <span>{title}</span>
          </nav>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
      </section>
      <div className="container content-page" style={narrow ? { maxWidth: 900 } : undefined}>
        {children}
      </div>
    </>
  );
}
