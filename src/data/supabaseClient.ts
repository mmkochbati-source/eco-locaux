import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Client Supabase du navigateur : clé publique anon uniquement (jamais la clé service_role).
// Créé à la demande pour que le mode mock fonctionne sans variables Supabase.

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis (voir .env.example)');
    client = createClient(url, anonKey);
  }
  return client;
}

export const isSupabaseSource = (import.meta.env.VITE_DATA_SOURCE ?? 'mock') === 'supabase';
