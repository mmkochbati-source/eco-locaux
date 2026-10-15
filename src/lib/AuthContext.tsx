import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabase, isSupabaseSource } from '../data/supabaseClient';

// Authentification Supabase (e-mail + mot de passe). En mode démo (mock), pas de connexion.

interface AuthState {
  enabled: boolean; // false en mode démo
  ready: boolean; // session initiale chargée
  session: Session | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, nom: string): Promise<{ confirmationRequise: boolean }>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function messageFr(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(message)) return 'Adresse e-mail non confirmée : ouvrez le lien reçu par e-mail.';
  if (/already registered|already exists/i.test(message)) return 'Un compte existe déjà avec cette adresse.';
  if (/password should be at least/i.test(message)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/rate limit/i.test(message)) return 'Trop de tentatives : réessayez dans quelques minutes.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseSource);

  useEffect(() => {
    if (!isSupabaseSource) return;
    const auth = getSupabase().auth;
    auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    enabled: isSupabaseSource,
    ready,
    session,
    async signIn(email, password) {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw new Error(messageFr(error.message));
    },
    async signUp(email, password, nom) {
      const { data, error } = await getSupabase().auth.signUp({ email, password, options: { data: { nom } } });
      if (error) throw new Error(messageFr(error.message));
      return { confirmationRequise: !data.session };
    },
    async signOut() {
      await getSupabase().auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
