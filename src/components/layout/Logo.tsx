import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="logo">
      <Image src="/assets/Corderband-logo.svg" alt="Cordeband" width={24} height={24} />
      <span className="logo-word">Cordeband</span>
    </Link>
  );
}
