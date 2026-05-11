import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import type { ActionResult } from '../types';

export interface AuthProfile {
  id: string;
  name: string;
  friendCode: string;
}

interface AuthContextValue {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  refreshProfile: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<ActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function result(ok: boolean, message: string): ActionResult {
  return { ok, message };
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, friend_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[auth] failed to load profile', error.message);
    return null;
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    name: data.name ?? '',
    friendCode: data.friend_code,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const user = session?.user ?? null;

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const next = await fetchProfile(user.id);
    setProfile(next);
  }, [user]);

  // Bootstrap: read any persisted session and subscribe to auth changes.
  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Whenever the signed-in user changes, refresh the profile row.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [user, refreshProfile]);

  const updateDisplayName = useCallback(
    async (name: string): Promise<ActionResult> => {
      const trimmed = name.trim();
      if (!trimmed) {
        return result(false, 'Please enter a name.');
      }
      if (!user) {
        return result(false, 'Not signed in.');
      }
      const { error } = await supabase
        .from('profiles')
        .update({ name: trimmed })
        .eq('id', user.id);
      if (error) {
        return result(false, error.message);
      }
      await refreshProfile();
      return result(true, 'Profile updated.');
    },
    [user, refreshProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value: AuthContextValue = {
    isLoading,
    session,
    user,
    profile,
    refreshProfile,
    updateDisplayName,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
}
