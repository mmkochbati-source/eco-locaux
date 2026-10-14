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
  lat: number;
  lng: number;
  telephone: string | null;
  horaires: Record<string, string> | null; // ex. { "mar-sam": "6h30–19h30", "dim": "7h–13h" }
  gerant: string | null;
  email: string | null;
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
}

export interface Profil {
  nom: string;
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
