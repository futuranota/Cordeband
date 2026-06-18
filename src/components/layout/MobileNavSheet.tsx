'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconMenu, IconClose } from '@/components/ui/icons';

export type MobileNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type MobileNavSheetProps = {
  items: MobileNavItem[];
  title?: string;
  footer?: React.ReactNode;
};

function isHashLink(href: string) {
  return href.startsWith('#');
}

export function MobileNavSheet({ items, title = 'Menú', footer }: MobileNavSheetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function toggle(e: React.MouseEvent | React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
  }

  const sheet = open && mounted ? createPortal(
    <>
      <button
        type="button"
        className="nav-mobile-backdrop"
        aria-label="Cerrar menú"
        onClick={close}
      />
      <div id="nav-mobile-sheet" className="nav-mobile-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="nav-mobile-sheet-head">
          <span className="nav-mobile-sheet-title">{title}</span>
          <button type="button" className="nav-burger nav-burger-close" aria-label="Cerrar menú" onClick={close}>
            <IconClose size={20} />
          </button>
        </div>

        {items.map((item) => {
          const className = `nav-mobile-link${item.active ? ' active' : ''}`;
          if (isHashLink(item.href)) {
            return (
              <a key={item.href} href={item.href} className={className} onClick={close}>
                {item.label}
              </a>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={className} onClick={close}>
              {item.label}
            </Link>
          );
        })}

        {footer && <div className="nav-mobile-footer">{footer}</div>}
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div className="nav-burger-wrap">
      <button
        type="button"
        className="nav-burger nav-burger-trigger"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        aria-controls="nav-mobile-sheet"
        onClick={toggle}
      >
        {open ? <IconClose size={20} /> : <IconMenu size={20} />}
      </button>
      {sheet}
    </div>
  );
}
