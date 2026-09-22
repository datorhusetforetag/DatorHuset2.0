import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    /*
     * Tillbaka dit man kom ifrån.
     *
     * Adminläget pekade tidigare alltid på https://admin.datorhuset.se,
     * oavsett var man faktiskt stod. Loggade man in i adminportalen
     * lokalt hamnade man alltså på den driftsatta sajten - inloggningen
     * lyckades, men man kastades ut ur det man höll på med.
     *
     * window.location.origin ger redan rätt svar i båda fallen: står
     * man på admin.datorhuset.se är det den adressen, och står man på
     * localhost är det localhost. Hårdkodningen tillförde ingenting
     * annat än felet.
     *
     * Supabase måste känna igen adressen. Varje origin som ska gå att
     * logga in från behöver stå under Redirect URLs i projektets
     * URL Configuration, annars byts den tyst mot Site URL - vilket är
     * precis hur det här yttrar sig.
     */
    const redirectTo = window.location.origin;
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

  /* Här satt en attrapp som låtsades att någon var inloggad när
     ?preview-auth=logged-in stod i adressen. Den fanns för
     sandlådans förhandsvisning, men läste parametern utan att fråga
     om man faktiskt var där - alltså gick den att sätta på den
     riktiga sajten och få gränssnittet att visa en inloggning som
     inte fanns. Sandlådan är borta, och attrappen med den. */
  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resendSignupEmail, signOut }}>
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
