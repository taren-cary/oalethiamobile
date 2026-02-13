'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { supabase } from '@/lib/supabase';
import { AnonymousCreditsManager } from '@/lib/anonymousCredits';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isFirstTimeUser: boolean;
  setFirstTimeUser: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if this is a first-time user
      if (session?.user) {
        checkFirstTimeUser(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Set user context in Sentry for error tracking
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email,
        });
        
        checkFirstTimeUser(session.user.id);
        
        // Clear anonymous data when user signs up
        if (event === 'SIGNED_IN') {
          if (typeof window !== 'undefined') {
            AnonymousCreditsManager.clearAnonymousData();
          }
        }
      } else {
        // Clear user context when signed out
        Sentry.setUser(null);
        setIsFirstTimeUser(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkFirstTimeUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('birth_charts')
        .select('birth_date, birth_time, location')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No birth chart found - first time user
        setIsFirstTimeUser(true);
      } else if (data && (!data.birth_date || !data.location)) {
        // Birth chart exists but missing data
        setIsFirstTimeUser(true);
      } else {
        setIsFirstTimeUser(false);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
      Sentry.captureException(error);
      setIsFirstTimeUser(true);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // First, check if username is available
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is what we want
      return { error: { message: 'Error checking username availability' } };
    }

    if (existingUser) {
      return { error: { message: 'Username is already taken' } };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email verification for now
      }
    });

    if (authError) {
      return { error: authError };
    }

    // If signup successful, save username to user_profiles
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          username: username.toLowerCase().trim()
        });

      if (profileError) {
        // If profile creation fails, we should handle it
        // For now, we'll log it but still return success since auth user was created
        console.error('Error saving username:', profileError);
        // Could optionally delete the auth user here, but that might be too aggressive
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const setFirstTimeUser = (value: boolean) => {
    setIsFirstTimeUser(value);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isFirstTimeUser,
    setFirstTimeUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
