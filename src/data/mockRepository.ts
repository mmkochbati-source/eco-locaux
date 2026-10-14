import type { Historique, Note, PreparationRdv, Prospect, RendezVous } from '../types';
import type { Repository } from './repository';
import {
  DEMO_HISTORIQUE,
  DEMO_NOTES,
  DEMO_PROFIL,
  DEMO_PROSPECTS,
  buildDemoRendezVous,
  buildPreparationContent,
} from './demoData';

// Simule le back-end (Supabase + workflows n8n) pour rendre tout le parcours testable.
// En développement :
//   ?simulate=error       → la préparation de RDV et l'analyse de note échouent
//   ?simulate=load-error  → les lectures échouent (états d'erreur des écrans)

const STORAGE_KEY = 'eco-locaux:mock:v1';
const LATENCY_MS = 250;
const PREPARATION_DELAY_MS = 2000;
const ANALYSE_DELAY_MS = 1500;
const NOTE_SHORTCUTS = ["Préfère l'après-midi", 'Décideur présent'];

interface State {
  prospects: Prospect[];
  historique: Historique[];
  notes: Note[];
  rendezVous: RendezVous[];
  preparations: PreparationRdv[];
}

function seed(): State {
  const rendezVous = buildDemoRendezVous();
  const prospects = structuredClone(DEMO_PROSPECTS);
  const preparations = rendezVous.map((r) => {
    const prospect = prospects.find((p) => p.id === r.prospect_id)!;
    return {
      id: `prep-${r.id}`,
      rdv_id: r.id,
      statut: 'pret' as const,
      ...buildPreparationContent(prospect),
      genere_le: new Date().toISOString(),
      modifie_par_commercial: false,
    };
  });
  return {
    prospects,
    historique: structuredClone(DEMO_HISTORIQUE),
    notes: structuredClone(DEMO_NOTES),
    rendezVous,
    preparations,
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // stockage indisponible ou corrompu : on repart des données de démo
  }
  return seed();
}

const state: State = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : les modifications restent en mémoire
  }
}

function simulate(mode: 'error' | 'load-error'): boolean {
  return new URLSearchParams(window.location.search).get('simulate') === mode;
}

async function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  if (simulate('load-error')) throw new Error('Erreur réseau simulée');
  return structuredClone(value);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function findProspect(id: string): Prospect {
  const p = state.prospects.find((x) => x.id === id);
  if (!p) throw new Error('Prospect introuvable');
  return p;
}

// --- Préparation : simulation du workflow WF3 et du Realtime ---

const listeners = new Map<string, Set<(p: PreparationRdv) => void>>();
const pendingTimers = new Map<string, number>();

function notify(prep: PreparationRdv) {
  listeners.get(prep.rdv_id)?.forEach((cb) => cb(structuredClone(prep)));
}

function schedulePreparation(rdvId: string) {
  if (pendingTimers.has(rdvId)) return;
  const fail = simulate('error');
  const timer = window.setTimeout(() => {
    pendingTimers.delete(rdvId);
    const prep = state.preparations.find((p) => p.rdv_id === rdvId);
    const rdv = state.rendezVous.find((r) => r.id === rdvId);
    if (!prep || !rdv) return;
    if (fail) {
      prep.statut = 'erreur';
    } else {
      Object.assign(prep, buildPreparationContent(findProspect(rdv.prospect_id)), {
        statut: 'pret',
        genere_le: new Date().toISOString(),
        modifie_par_commercial: false,
      });
    }
    persist();
    notify(prep);
  }, PREPARATION_DELAY_MS);
  pendingTimers.set(rdvId, timer);
}

function findPreparation(rdvId: string): PreparationRdv {
  const prep = state.preparations.find((p) => p.rdv_id === rdvId);
  if (!prep) throw new Error('Préparation introuvable');
  // Après un rechargement, une génération en cours est relancée.
  if (prep.statut === 'en_cours') schedulePreparation(rdvId);
  return prep;
}

// --- Analyse de note : simulation du workflow WF2 ---

function scheduleAnalyse(noteId: string) {
  const fail = simulate('error');
  window.setTimeout(() => {
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;
    if (fail) {
      note.statut_analyse = 'erreur';
    } else {
      note.statut_analyse = 'terminee';
      const prospect = findProspect(note.prospect_id);
      const found = NOTE_SHORTCUTS.filter((label) => note.texte.includes(label));
      prospect.tags = Array.from(new Set([...prospect.tags, ...found]));
    }
    persist();
  }, ANALYSE_DELAY_MS);
}

export const mockRepository: Repository = {
  getProfil: () => delay(DEMO_PROFIL),

  listProspects: (filters = {}) => {
    const q = filters.q ? normalize(filters.q.trim()) : '';
    const result = state.prospects.filter(
      (p) =>
        (!filters.categorie || p.categorie === filters.categorie) &&
        (!filters.statut || p.statut === filters.statut) &&
        (!filters.priorite || p.priorite === filters.priorite) &&
        (!q || normalize(`${p.nom} ${p.adresse}`).includes(q)),
    );
    return delay(result);
  },

  getProspect: async (id) => delay(findProspect(id)),

  createProspect: async (input) => {
    // Le back-end enrichira la fiche (Google Places, score) ; le mock la place au centre du secteur.
    const prospect: Prospect = {
      id: uid('p'),
      commercial_id: 'com-camille',
      secteur_id: 'sec-lyon-nord',
      google_place_id: null,
      nom: input.nom,
      categorie: input.categorie,
      adresse: input.adresse,
      lat: DEMO_PROFIL.centre.lat,
      lng: DEMO_PROFIL.centre.lng,
      telephone: null,
      horaires: null,
      gerant: null,
      email: null,
      surface_m2: null,
      surface_production_m2: null,
      employes: null,
      date_ouverture: null,
      echeance_contrat: null,
      statut: 'nouveau',
      priorite: 'normale',
      niveau_interet: null,
      score_potentiel: 0,
      conso_estimee_mwh: null,
      economies_estimees_eur: null,
      economies_pct: null,
      conso_vs_moyenne_pct: null,
      percentile_secteur: null,
      repartition_conso: null,
      tags: [],
    };
    state.prospects.push(prospect);
    state.historique.push({
      id: uid('h'),
      prospect_id: prospect.id,
      type: 'ajout',
      resume: 'Ajouté manuellement.',
      date: new Date().toISOString(),
    });
    persist();
    return delay(prospect);
  },

  updateProspect: async (id, patch) => {
    const p = findProspect(id);
    Object.assign(p, patch, { id: p.id });
    persist();
    return delay(p);
  },

  listHistorique: async (prospectId) =>
    delay(
      state.historique
        .filter((h) => h.prospect_id === prospectId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    ),

  addHistorique: async (prospectId, input) => {
    findProspect(prospectId);
    const h: Historique = { id: uid('h'), prospect_id: prospectId, ...input, date: new Date().toISOString() };
    state.historique.push(h);
    persist();
    return delay(h);
  },

  getNote: async (prospectId) => delay(state.notes.find((n) => n.prospect_id === prospectId) ?? null),

  saveNote: async (prospectId, texte) => {
    findProspect(prospectId);
    let note = state.notes.find((n) => n.prospect_id === prospectId);
    if (note) {
      note.texte = texte;
      note.statut_analyse = 'en_cours';
    } else {
      note = { id: uid('n'), prospect_id: prospectId, texte, statut_analyse: 'en_cours', created_at: new Date().toISOString() };
      state.notes.push(note);
    }
    persist();
    scheduleAnalyse(note.id);
    return delay(note);
  },

  listRendezVous: async () =>
    delay(
      state.rendezVous
        .map((r) => {
          const p = findProspect(r.prospect_id);
          return { ...r, prospect: { id: p.id, nom: p.nom, categorie: p.categorie } };
        })
        .sort((a, b) => a.date_heure.localeCompare(b.date_heure)),
    ),

  createRendezVous: async (prospectId, date_heure) => {
    findProspect(prospectId);
    const rdv: RendezVous = { id: uid('r'), prospect_id: prospectId, date_heure, duree_min: 45, statut: 'planifie' };
    state.rendezVous.push(rdv);
    state.preparations.push({
      id: uid('prep'),
      rdv_id: rdv.id,
      statut: 'en_cours',
      trajet: null,
      checklist: { objectifs: [], documents: [], questions: [] },
      points_cles: [],
      objections: [],
      genere_le: null,
      modifie_par_commercial: false,
    });
    persist();
    schedulePreparation(rdv.id);
    return delay(rdv);
  },

  getRendezVous: async (id) => {
    const rdv = state.rendezVous.find((r) => r.id === id);
    if (!rdv) throw new Error('Rendez-vous introuvable');
    return delay({ ...rdv, prospect: findProspect(rdv.prospect_id) });
  },

  getPreparation: async (rdvId) => delay(findPreparation(rdvId)),

  subscribePreparation: (rdvId, cb) => {
    if (!listeners.has(rdvId)) listeners.set(rdvId, new Set());
    listeners.get(rdvId)!.add(cb);
    return () => {
      listeners.get(rdvId)?.delete(cb);
    };
  },

  regeneratePreparation: async (rdvId) => {
    const prep = findPreparation(rdvId);
    prep.statut = 'en_cours';
    persist();
    notify(prep);
    schedulePreparation(rdvId);
    await delay(null);
  },

  updatePreparation: async (rdvId, patch) => {
    const prep = findPreparation(rdvId);
    Object.assign(prep, patch);
    if (patch.points_cles || patch.objections) prep.modifie_par_commercial = true;
    persist();
    await delay(null);
  },

  // Avec le mock, l'écran ouvre la boîte d'impression du navigateur.
  exportPreparationPdf: async () => delay({ pdf_url: null }),
};
