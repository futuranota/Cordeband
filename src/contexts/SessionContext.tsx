'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

type SessionContextValue = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
});

export function SessionProvider({
  user,
  profile,
  isAdmin = false,
  children,
}: SessionContextValue & { children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={{ user, profile, isAdmin }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
