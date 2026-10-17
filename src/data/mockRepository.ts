import type { EmailProspection, Historique, Note, Pilotage, PreparationRdv, Prospect, RendezVous, StatutProspect } from '../types';
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
  emails?: EmailProspection[];
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

const noteListeners = new Map<string, Set<(n: Note) => void>>();

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
    noteListeners.get(note.prospect_id)?.forEach((cb) => cb(structuredClone(note)));
  }, ANALYSE_DELAY_MS);
}

// --- Email de prospection : simulation de WF4 (rédaction) et WF5 (envoi) ---

const emailListeners = new Map<string, Set<(e: EmailProspection) => void>>();
const EMAIL_DELAY_MS = 1500;

function emails(): EmailProspection[] {
  if (!state.emails) state.emails = [];
  return state.emails;
}

function notifyEmail(e: EmailProspection) {
  emailListeners.get(e.prospect_id)?.forEach((cb) => cb(structuredClone(e)));
}

const POSTES: Record<Prospect['categorie'], string> = {
  boulangerie: 'les fours de cuisson et les chambres de froid',
  cafe: 'les machines à café et les frigos de bar',
  epicerie: 'les meubles frigorifiques ouverts et l\'éclairage',
  coiffure: "l'eau chaude des bacs et les sèche-cheveux",
  pharmacie: "l'éclairage de l'enseigne et la climatisation",
};

function demoEmail(p: Prospect): Pick<EmailProspection, 'objet' | 'message'> {
  return {
    objet: `${p.nom} : alléger la facture d'énergie`,
    message:
      `Bonjour,\n\nDans un commerce comme le vôtre, ${POSTES[p.categorie]} pèsent souvent lourd sur la facture d'électricité. ` +
      `Chaque poste mal réglé grignote directement la marge.\n\nEco-Locaux propose un court diagnostic pour repérer où ${p.nom} consomme le plus ` +
      `et les premières actions pour alléger la facture.\n\nAuriez-vous 15 minutes cette semaine ou la suivante, sur place ou par téléphone ?\n\n` +
      `Si le sujet ne vous intéresse pas, répondez simplement « non merci » et je ne vous recontacterai pas.\n\n${DEMO_PROFIL.nom}\nEco-Locaux`,
  };
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
      site_web: null,
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

  // En démo, l'import Google Places n'ajoute rien : les 6 commerces de la maquette suffisent.
  importProspects: async () => {
    await delay(null);
  },

  // En démo, la liste se rafraîchit via l'événement DATA_CHANGED_EVENT.
  subscribeProspects: () => () => {},

  subscribeNote: (prospectId, cb) => {
    if (!noteListeners.has(prospectId)) noteListeners.set(prospectId, new Set());
    noteListeners.get(prospectId)!.add(cb);
    return () => {
      noteListeners.get(prospectId)?.delete(cb);
    };
  },

  getDernierEmail: async (prospectId) =>
    delay(
      emails()
        .filter((e) => e.prospect_id === prospectId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    ),

  preparerEmail: async (prospectId) => {
    const p = findProspect(prospectId);
    const email: EmailProspection = {
      id: uid('e'),
      prospect_id: prospectId,
      destinataire: null,
      objet: null,
      message: null,
      statut: 'generation',
      erreur_detail: null,
      envoye_le: null,
      created_at: new Date().toISOString(),
    };
    emails().push(email);
    persist();
    const fail = simulate('error');
    window.setTimeout(() => {
      Object.assign(
        email,
        fail
          ? { statut: 'erreur', erreur_detail: 'Réponse IA invalide (simulation).' }
          : { ...demoEmail(p), destinataire: p.email, statut: 'brouillon' },
      );
      persist();
      notifyEmail(email);
    }, EMAIL_DELAY_MS);
    return delay(email);
  },

  updateEmail: async (id, patch) => {
    const email = emails().find((e) => e.id === id);
    if (!email) throw new Error('Email introuvable');
    Object.assign(email, patch);
    persist();
    await delay(null);
  },

  envoyerEmail: async (id) => {
    const email = emails().find((e) => e.id === id);
    if (!email) throw new Error('Email introuvable');
    if (!email.destinataire || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.destinataire)) {
      throw new Error("L'email est incomplet (adresse, objet ou message) ou déjà envoyé.");
    }
    email.statut = 'envoi';
    persist();
    notifyEmail(email);
    window.setTimeout(() => {
      // Démo : aucun email ne part réellement.
      email.statut = 'envoye';
      email.envoye_le = new Date().toISOString();
      const p = findProspect(email.prospect_id);
      if (p.statut === 'nouveau') p.statut = 'contacte';
      state.historique.push({
        id: uid('h'),
        prospect_id: p.id,
        type: 'email',
        resume: `Email envoyé : ${email.objet ?? ''}`,
        date: new Date().toISOString(),
      });
      persist();
      notifyEmail(email);
    }, EMAIL_DELAY_MS);
    await delay(null);
  },

  subscribeEmail: (prospectId, cb) => {
    if (!emailListeners.has(prospectId)) emailListeners.set(prospectId, new Set());
    emailListeners.get(prospectId)!.add(cb);
    return () => {
      emailListeners.get(prospectId)?.delete(cb);
    };
  },

  getPilotage: async () => {
    const ps = state.prospects;
    const ORDRE: StatutProspect[] = ['nouveau', 'contacte', 'rdv_planifie', 'client', 'perdu'];
    const eco = (list: Prospect[]) => list.filter((p) => p.statut !== 'perdu').reduce((s, p) => s + (p.economies_estimees_eur ?? 0), 0);
    const cats = Array.from(new Set(ps.map((p) => p.categorie)));
    const envoyes = emails().filter((e) => e.statut === 'envoye').length;
    const pilotage: Pilotage = {
      genere_le: new Date().toISOString(),
      totaux: {
        prospects: ps.length,
        contactes: ps.filter((p) => p.statut !== 'nouveau').length,
        rdv_planifies: ps.filter((p) => p.statut === 'rdv_planifie' || p.statut === 'client').length,
        clients: ps.filter((p) => p.statut === 'client').length,
        perdus: ps.filter((p) => p.statut === 'perdu').length,
        priorite_haute: ps.filter((p) => p.priorite === 'haute').length,
        economies_potentielles_eur: eco(ps),
        score_moyen: ps.length ? Math.round(ps.reduce((s, p) => s + p.score_potentiel, 0) / ps.length) : 0,
      },
      emails: { envoyes, brouillons: emails().filter((e) => e.statut === 'brouillon').length },
      rdv: {
        a_venir: state.rendezVous.filter((r) => r.statut === 'planifie' && r.date_heure >= new Date().toISOString()).length,
        realises: state.rendezVous.filter((r) => r.statut === 'realise').length,
        annules: state.rendezVous.filter((r) => r.statut === 'annule').length,
      },
      par_statut: ORDRE.map((statut) => ({ statut, nb: ps.filter((p) => p.statut === statut).length })).filter((x) => x.nb > 0),
      par_categorie: cats
        .map((categorie) => {
          const list = ps.filter((p) => p.categorie === categorie);
          return {
            categorie,
            prospects: list.length,
            rdv: list.filter((p) => p.statut === 'rdv_planifie' || p.statut === 'client').length,
            score_moyen: Math.round(list.reduce((s, p) => s + p.score_potentiel, 0) / list.length),
            economies_eur: eco(list),
          };
        })
        .sort((a, b) => b.economies_eur - a.economies_eur),
      par_commercial: [
        {
          nom: DEMO_PROFIL.nom,
          secteur: DEMO_PROFIL.secteur_nom,
          prospects: ps.length,
          contactes: ps.filter((p) => p.statut !== 'nouveau').length,
          emails_envoyes: envoyes,
          rdv: state.rendezVous.filter((r) => r.statut !== 'annule').length,
          clients: ps.filter((p) => p.statut === 'client').length,
        },
      ],
    };
    return delay(pilotage);
  },
};
