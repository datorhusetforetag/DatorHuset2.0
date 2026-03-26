import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getPreviewAuthOverride } from '@/lib/previewMode';

interface AuthContextType {
  session: Session | null;
  user: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  resendSignupEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const previewAuthOverride = getPreviewAuthOverride();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo =
      import.meta.env.VITE_APP_MODE === 'admin'
        ? 'https://admin.datorhuset.site'
        : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Email login error:', error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const resendSignupEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Resend signup error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
  };

  const mockPreviewUser =
    previewAuthOverride === 'logged-in'
      ? {
          id: 'preview-user',
          email: 'preview@datorhuset.site',
          user_metadata: {
            username: 'Previewkund',
            full_name: 'Previewkund',
          },
          app_metadata: {},
        }
      : null;
  const effectiveSession = previewAuthOverride === 'logged-out' ? null : session;
  const effectiveUser = previewAuthOverride === 'logged-out' ? null : user || mockPreviewUser;
  const effectiveLoading = previewAuthOverride ? false : loading;

  return (
    <AuthContext.Provider value={{ session: effectiveSession, user: effectiveUser, loading: effectiveLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, resendSignupEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
