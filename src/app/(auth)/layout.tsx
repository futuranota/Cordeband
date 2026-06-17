import { LandingNav } from '@/components/layout/LandingNav';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  );
}
