// Types alignés sur les colonnes Supabase (snake_case, en français) — voir docs/SPEC_FRONT.md.

export type Categorie = 'boulangerie' | 'cafe' | 'epicerie' | 'coiffure' | 'pharmacie';
export type StatutProspect = 'nouveau' | 'contacte' | 'rdv_planifie' | 'client' | 'perdu';
export type Priorite = 'haute' | 'normale' | 'basse';
export type NiveauInteret = 'faible' | 'moyen' | 'eleve';

export interface Prospect {
  id: string;
  commercial_id: string;
  secteur_id: string;
  google_place_id: string | null;
  nom: string;
  categorie: Categorie;
  adresse: string;
  lat: number | null; // null tant que l'adresse n'est pas géocodée : masqué sur la carte, gardé dans la liste
  lng: number | null;
  telephone: string | null;
  horaires: Record<string, string> | null; // ex. { "mar-sam": "6h30–19h30", "dim": "7h–13h" }
  gerant: string | null;
  email: string | null;
  site_web: string | null; // source de l'email professionnel (WF1)
  surface_m2: number | null;
  surface_production_m2: number | null; // ex. fournil 40 m²
  employes: number | null;
  date_ouverture: string | null; // ISO date
  echeance_contrat: string | null; // ISO date (mois suffisant)
  statut: StatutProspect;
  priorite: Priorite;
  niveau_interet: NiveauInteret | null;
  score_potentiel: number; // 0–100, calculé en base
  conso_estimee_mwh: number | null;
  economies_estimees_eur: number | null;
  economies_pct: number | null; // à ajouter au schéma
  conso_vs_moyenne_pct: number | null; // à ajouter au schéma
  percentile_secteur: number | null; // à ajouter au schéma (« Top 12 % »)
  repartition_conso: { fours?: number; froid?: number; eclairage?: number; autres?: number } | null; // en %
  tags: string[];
}

export type TypeHistorique = 'appel' | 'visite' | 'email' | 'note' | 'rdv' | 'ajout';
export interface Historique {
  id: string;
  prospect_id: string;
  type: TypeHistorique;
  resume: string;
  date: string;
}

export interface Note {
  id: string;
  prospect_id: string;
  texte: string;
  statut_analyse: 'aucune' | 'en_cours' | 'terminee' | 'erreur';
  analyse_ia?: unknown;
  created_at: string;
}

export interface RendezVous {
  id: string;
  prospect_id: string;
  date_heure: string;
  duree_min: number;
  statut: 'planifie' | 'realise' | 'annule';
}

export interface ChecklistItem {
  id: string;
  libelle: string;
  coche: boolean;
}
export interface PreparationRdv {
  id: string;
  rdv_id: string;
  statut: 'en_cours' | 'pret' | 'erreur';
  trajet: { voiture_min: number; velo_min: number } | null;
  checklist: { objectifs: ChecklistItem[]; documents: ChecklistItem[]; questions: ChecklistItem[] };
  points_cles: { titre: string; detail: string }[];
  objections: { objection: string; reponse: string; source: 'reference' | 'ia' }[];
  genere_le: string | null;
  modifie_par_commercial: boolean;
  erreur_detail?: string | null;
}

export type RoleProfil = 'commercial' | 'admin';

export interface Profil {
  nom: string;
  role: RoleProfil; // admin = direction : accès à l'écran Pilotage
  secteur_id: string | null;
  initiales: string;
  secteur_nom: string;
  centre: { lat: number; lng: number };
  rayon_km: number;
}

export interface ProspectFilters {
  categorie?: Categorie;
  statut?: StatutProspect;
  priorite?: Priorite;
  q?: string;
}

export type RendezVousAvecProspect = RendezVous & { prospect: Pick<Prospect, 'id' | 'nom' | 'categorie'> };

// Email de prospection : brouillon rédigé par l'IA (WF4), relu par le commercial, envoyé par WF5.
export type StatutEmail = 'generation' | 'brouillon' | 'envoi' | 'envoye' | 'erreur';
export interface EmailProspection {
  id: string;
  prospect_id: string;
  destinataire: string | null;
  objet: string | null;
  message: string | null;
  statut: StatutEmail;
  erreur_detail: string | null;
  envoye_le: string | null;
  created_at: string;
}

// Écran Pilotage (direction) : agrégats calculés en base par eco_pilotage().
export interface Pilotage {
  genere_le: string;
  totaux: {
    prospects: number;
    contactes: number;
    rdv_planifies: number;
    clients: number;
    perdus: number;
    priorite_haute: number;
    economies_potentielles_eur: number;
    score_moyen: number;
  };
  emails: { envoyes: number; brouillons: number };
  rdv: { a_venir: number; realises: number; annules: number };
  par_statut: { statut: StatutProspect; nb: number }[];
  par_categorie: { categorie: Categorie; prospects: number; rdv: number; score_moyen: number; economies_eur: number }[];
  par_commercial: {
    nom: string;
    secteur: string | null;
    prospects: number;
    contactes: number;
    emails_envoyes: number;
    rdv: number;
    clients: number;
  }[];
}
