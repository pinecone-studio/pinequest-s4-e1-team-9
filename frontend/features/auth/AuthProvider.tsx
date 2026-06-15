'use client';

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from '@/features/auth/supabase';
import {
  getCurrentProfile,
  updateCurrentProfile,
  type UserProfile,
} from '@/features/profile/api';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  profile: UserProfile | null;
  profileError: string | null;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfileName: (name: string) => Promise<UserProfile>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) {
      setConfigError(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) setConfigError(error.message);
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileError(null);
      }
      setConfigError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return null;
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const nextProfile = await getCurrentProfile(session.access_token);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load profile.';
      setProfileError(message);
      setProfile(null);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    void refreshProfile().catch(() => undefined);
  }, [refreshProfile, session]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const accessToken = data.session?.access_token;

    if (accessToken) {
      try {
        const nextProfile = await updateCurrentProfile(name, accessToken);
        setProfile(nextProfile);
        setProfileError(null);
      } catch {
        throw new Error(
          'Your account was created, but the profile name could not be saved. Please complete your profile to continue.',
        );
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseBrowserClient().auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setProfile(null);
  }, []);

  const updateProfileName = useCallback(
    async (name: string) => {
      if (!session) {
        throw new Error('Please sign in before updating your profile.');
      }

      const nextProfile = await updateCurrentProfile(
        name,
        session.access_token,
      );
      setProfile(nextProfile);
      setProfileError(null);
      return nextProfile;
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isProfileLoading,
      configError,
      signIn,
      signUp,
      signOut,
      profile,
      profileError,
      refreshProfile,
      updateProfileName,
    }),
    [
      configError,
      isLoading,
      isProfileLoading,
      profile,
      profileError,
      refreshProfile,
      session,
      signIn,
      signOut,
      signUp,
      updateProfileName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
