import type {
  Categorie,
  Historique,
  Note,
  PreparationRdv,
  Profil,
  Prospect,
  ProspectFilters,
  RendezVous,
  RendezVousAvecProspect,
  TypeHistorique,
} from '../types';
import { mockRepository } from './mockRepository';
import { supabaseRepository } from './supabaseRepository';

export interface Repository {
  getProfil(): Promise<Profil>;
  listProspects(filters?: ProspectFilters): Promise<Prospect[]>;
  getProspect(id: string): Promise<Prospect>;
  createProspect(input: { nom: string; categorie: Categorie; adresse: string }): Promise<Prospect>;
  updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect>;
  listHistorique(prospectId: string): Promise<Historique[]>;
  addHistorique(prospectId: string, input: { type: TypeHistorique; resume: string }): Promise<Historique>;
  getNote(prospectId: string): Promise<Note | null>;
  saveNote(prospectId: string, texte: string): Promise<Note>; // déclenche WF2 (analyse IA)
  listRendezVous(): Promise<RendezVousAvecProspect[]>;
  createRendezVous(prospectId: string, date_heure: string): Promise<RendezVous>; // déclenche WF3
  getRendezVous(id: string): Promise<RendezVous & { prospect: Prospect }>;
  getPreparation(rdvId: string): Promise<PreparationRdv>;
  subscribePreparation(rdvId: string, cb: (p: PreparationRdv) => void): () => void; // Realtime ; retourne la désinscription
  regeneratePreparation(rdvId: string): Promise<void>; // WF3 à nouveau
  updatePreparation(
    rdvId: string,
    patch: Partial<Pick<PreparationRdv, 'checklist' | 'points_cles' | 'objections'>>,
  ): Promise<void>; // met modifie_par_commercial à true pour points_cles / objections
  exportPreparationPdf(rdvId: string): Promise<{ pdf_url: string | null }>; // WF4
}

// Événement émis après chaque écriture, pour que la sidebar (badges) se mette à jour.
export const DATA_CHANGED_EVENT = 'eco-locaux:data-changed';

const WRITE_METHODS = new Set<keyof Repository>([
  'createProspect',
  'updateProspect',
  'addHistorique',
  'saveNote',
  'createRendezVous',
  'regeneratePreparation',
  'updatePreparation',
]);

function withChangeEvents(repo: Repository): Repository {
  const wrapped = { ...repo };
  for (const key of WRITE_METHODS) {
    const original = repo[key] as (...args: unknown[]) => Promise<unknown>;
    (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
      const result = await original.apply(repo, args);
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
      return result;
    };
  }
  return wrapped;
}

const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock';

export const repository: Repository = withChangeEvents(source === 'supabase' ? supabaseRepository : mockRepository);
