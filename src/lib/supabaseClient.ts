import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars missing; running in offline/mock mode. Auth features disabled.");

  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithOAuth: async () => ({
      data: null,
      error: new Error("Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."),
    }),
    signOut: async () => ({
      error: new Error("Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."),
    }),
  };

  // Minimal mock client to keep the app running locally without env vars
  supabaseInstance = { auth: mockAuth };
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
