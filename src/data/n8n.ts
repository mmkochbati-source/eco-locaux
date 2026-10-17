import type { Categorie } from '../types';
import { getSupabase } from './supabaseClient';

// Appels aux webhooks n8n. Le front n'attend pas le résultat du traitement (202) :
// il écoute ensuite Supabase Realtime (prospects, notes, preparations_rdv).
// URL = {VITE_N8N_BASE_URL}/{VITE_N8N_WEBHOOK_PREFIX}/eco-locaux/<chemin>

export class N8nError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'N8nError';
  }
}

function webhookUrl(path: string): string {
  const base = import.meta.env.VITE_N8N_BASE_URL;
  const prefix = import.meta.env.VITE_N8N_WEBHOOK_PREFIX ?? 'webhook';
  if (!base) throw new N8nError('VITE_N8N_BASE_URL manquant (voir .env.example)', null);
  return `${base.replace(/\/$/, '')}/${prefix}/eco-locaux/${path}`;
}

async function call(path: string, body: unknown): Promise<void> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new N8nError('Session expirée : reconnectez-vous.', 401);

  let res: Response;
  try {
    res = await fetch(webhookUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new N8nError('Le service de traitement est injoignable. Réessayez dans un instant.', null);
  }

  if (res.ok) return;
  if (res.status === 401 || res.status === 403) {
    throw new N8nError("Accès refusé : vous n'avez pas accès à cette ressource.", res.status);
  }
  if (res.status === 422) {
    throw new N8nError("L'email est incomplet (adresse, objet ou message) ou déjà envoyé.", 422);
  }
  if (res.status === 404) {
    throw new N8nError("Le traitement n'est pas disponible (webhook n8n inactif).", 404);
  }
  throw new N8nError(`Le traitement a échoué (erreur ${res.status}).`, res.status);
}

export const n8n = {
  importerProspects: (secteur_id: string, categories: Categorie[]) => call('importer-prospects', { secteur_id, categories }),
  analyserNote: (note_id: string) => call('analyser-note', { note_id }),
  preparerRdv: (rdv_id: string) => call('preparer-rdv', { rdv_id }),
  redigerEmail: (email_id: string) => call('rediger-email', { email_id }),
  envoyerEmail: (email_id: string) => call('envoyer-email', { email_id }),
};
