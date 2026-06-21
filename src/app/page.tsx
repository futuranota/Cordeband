import { LandingNav } from '@/components/layout/LandingNav';
import { Footer } from '@/components/layout/Footer';
import { HeroMotion } from '@/components/landing/HeroMotion';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowSection } from '@/components/landing/HowSection';
import { BandShareSection } from '@/components/landing/BandShareSection';
import { InstrumentsSection } from '@/components/landing/InstrumentsSection';
import { StemPreviewSection } from '@/components/landing/StemPreviewSection';

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

      {/* Stem demo */}
      <StemPreviewSection />

      {/* Pricing */}
      <PricingSection />

      {/* Testimonials */}
      <TestimonialSection />

      <Footer />
    </>
  );
}
