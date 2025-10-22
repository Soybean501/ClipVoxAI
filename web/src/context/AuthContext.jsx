import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {
    throw new Error("Auth provider not initialised");
  },
  signUp: async () => {
    throw new Error("Auth provider not initialised");
  },
  signOut: async () => {
    throw new Error("Auth provider not initialised");
  },
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialise() {
      if (!supabase) {
        setSession(null);
        setLoading(false);
        return;
      }

      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(existingSession);
        setLoading(false);
      }
    }

    initialise();

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signIn(email, password) {
        if (!supabase) throw new Error("Supabase client not configured.");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        return data;
      },
      async signUp(email, password) {
        if (!supabase) throw new Error("Supabase client not configured.");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          return { ...data, requiresConfirmation: false };
        }
        return { ...data, requiresConfirmation: true };
      },
      async signOut() {
        if (!supabase) throw new Error("Supabase client not configured.");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
