'use client';

import { useT } from '@/i18n/context';

export function LangToggle() {
  const { lang, setLang } = useT();
  const isEN = lang === 'en';

  return (
    <button
      className="lang-switch"
      onClick={() => setLang(isEN ? 'es' : 'en')}
      aria-label="Cambiar idioma / Switch language"
    >
      <span
        className="lang-switch-thumb"
        style={{ transform: isEN ? 'translateX(36px)' : 'translateX(2px)' }}
      />
      <span className="lang-switch-label" style={{ opacity: isEN ? 0.38 : 1, color: '#fff' }}>ES</span>
      <span className="lang-switch-label" style={{ opacity: isEN ? 1 : 0.38, color: '#fff' }}>EN</span>
    </button>
  );
}
