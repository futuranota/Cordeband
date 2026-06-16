'use client';

import { useT } from '@/i18n/context';

export function TestimonialSection() {
  const { t } = useT();

  const cards = [
    { q: t('testimonials.q1'), n: t('testimonials.n1'), r: t('testimonials.r1') },
    { q: t('testimonials.q2'), n: t('testimonials.n2'), r: t('testimonials.r2') },
    { q: t('testimonials.q3'), n: t('testimonials.n3'), r: t('testimonials.r3') },
  ];

  return (
    <section className="section" style={{ background: 'var(--surface)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="eyebrow">{t('testimonials.eyebrow')}</p>
          <h2 className="h2" style={{ marginTop: 12 }}>{t('testimonials.title')}</h2>
        </div>
        <div className="testimonial-grid">
          {cards.map((c, i) => (
            <div key={i} className="testimonial-card">
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                &ldquo;{c.q}&rdquo;
              </p>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{c.n}</p>
                <p className="muted" style={{ fontSize: 13, margin: '2px 0 0' }}>{c.r}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
