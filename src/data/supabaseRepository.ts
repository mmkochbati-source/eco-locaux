import type { Repository } from './repository';

// Squelette : implémenté à l'étape suivante (tables, RLS, Realtime, webhooks n8n).
// Le client sera créé avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (clé anon uniquement).

function notImplemented(): never {
  throw new Error('supabaseRepository : pas encore implémenté (VITE_DATA_SOURCE=mock pour la démo)');
}

export const supabaseRepository: Repository = {
  getProfil: async () => notImplemented(),
  listProspects: async () => notImplemented(),
  getProspect: async () => notImplemented(),
  createProspect: async () => notImplemented(),
  updateProspect: async () => notImplemented(),
  listHistorique: async () => notImplemented(),
  addHistorique: async () => notImplemented(),
  getNote: async () => notImplemented(),
  saveNote: async () => notImplemented(),
  listRendezVous: async () => notImplemented(),
  createRendezVous: async () => notImplemented(),
  getRendezVous: async () => notImplemented(),
  getPreparation: async () => notImplemented(),
  subscribePreparation: () => notImplemented(),
  regeneratePreparation: async () => notImplemented(),
  updatePreparation: async () => notImplemented(),
  exportPreparationPdf: async () => notImplemented(),
};
