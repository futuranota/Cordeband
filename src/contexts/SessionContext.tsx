'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

type SessionContextValue = {
  user: User | null;
  profile: Profile | null;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  profile: null,
});

export function SessionProvider({
  user,
  profile,
  children,
}: SessionContextValue & { children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={{ user, profile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
