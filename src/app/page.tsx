import { LandingNav } from '@/components/layout/LandingNav';
import { Footer } from '@/components/layout/Footer';
import { HeroMotion } from '@/components/landing/HeroMotion';
import { PriceCard } from '@/components/landing/PriceCard';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowSection } from '@/components/landing/HowSection';
import { BandShareSection } from '@/components/landing/BandShareSection';
import { InstrumentsSection } from '@/components/landing/InstrumentsSection';

export default function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="hero">
        <div className="hero-stage">
          <HeroMotion />
        </div>
        <div className="hero-inner wrap">
          <HeroSection />
        </div>
      </section>

      {/* How it works */}
      <HowSection />

      {/* Band share */}
      <BandShareSection />

      {/* Instruments */}
      <InstrumentsSection />

      {/* Pricing */}
      <section id="pricing" className="section">
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="eyebrow" suppressHydrationWarning>Precios</p>
            <h2 className="h2" style={{ marginTop: 12 }} suppressHydrationWarning>
              Empieza gratis. Sube de plan cuando la música te pida más.
            </h2>
          </div>
          <div className="price-grid">
            <PriceCard tier="free" />
            <PriceCard tier="pro" />
            <PriceCard tier="banda" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialSection />

      <Footer />
    </>
  );
}
