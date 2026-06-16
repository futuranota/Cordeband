'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { STR, type Lang } from './strings';

type TFn = (key: string) => string;
type LangCtxValue = { lang: Lang; t: TFn; setLang: (l: Lang) => void };

const LangCtx = createContext<LangCtxValue>({
  lang: 'es',
  t: (k) => k,
  setLang: () => {},
});

function resolve(lang: Lang, key: string): string {
  const path = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let v: any = STR[lang];
  for (const k of path) {
    v = v?.[k] ?? null;
    if (v == null) break;
  }
  if (v == null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let f: any = STR.es;
    for (const k of path) {
      f = f?.[k] ?? null;
      if (f == null) break;
    }
    return f == null ? key : String(f);
  }
  return String(v);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('cordeband_lang') as Lang | null;
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('cordeband_lang', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((k: string) => resolve(lang, k), [lang]);

  return <LangCtx.Provider value={{ lang, t, setLang }}>{children}</LangCtx.Provider>;
}

export function useT() {
  return useContext(LangCtx);
}
