import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: { message: string } | null }>;
  signIn: (email: string, password: string) => Promise<{
    error: { message: string } | null;
  }>;
  signOut: () => Promise<void>;
  isFirstTimeUser: boolean;
  setFirstTimeUser: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const checkFirstTimeUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('birth_charts')
        .select('birth_date, birth_time, location')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        setIsFirstTimeUser(true);
      } else if (data && (!data.birth_date || !data.location)) {
        setIsFirstTimeUser(true);
      } else {
        setIsFirstTimeUser(false);
      }
    } catch (err) {
      setIsFirstTimeUser(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        checkFirstTimeUser(initialSession.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        checkFirstTimeUser(newSession.user.id);
      } else {
        setIsFirstTimeUser(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkFirstTimeUser]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      username: string
    ): Promise<{ error: { message: string } | null }> => {
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { error: { message: 'Error checking username availability' } };
      }

      if (existingUser) {
        return { error: { message: 'Username is already taken' } };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined },
      });

      if (authError) {
        return { error: { message: authError.message } };
      }

      if (authData.user) {
        await supabase.from('user_profiles').insert({
          user_id: authData.user.id,
          username: username.toLowerCase().trim(),
        });
      }

      return { error: null };
    },
    []
  );

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: { message: string } | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const setFirstTimeUser = useCallback((value: boolean) => {
    setIsFirstTimeUser(value);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isFirstTimeUser,
    setFirstTimeUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
