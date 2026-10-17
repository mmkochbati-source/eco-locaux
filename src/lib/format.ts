import type { Categorie, Priorite, StatutProspect, TypeHistorique } from '../types';

// Affichage uniquement : libellés, formats, distance. Aucun chiffre métier n'est calculé ici.

export const CATEGORIE_LABEL: Record<Categorie, string> = {
  boulangerie: 'Boulangerie',
  cafe: 'Café',
  epicerie: 'Épicerie',
  coiffure: 'Coiffure',
  pharmacie: 'Pharmacie',
  autre: 'Autre',
};

export const CATEGORIE_PLURIEL: Record<Categorie, string> = {
  boulangerie: 'Boulangeries',
  cafe: 'Cafés',
  epicerie: 'Épiceries',
  coiffure: 'Coiffure',
  pharmacie: 'Pharmacies',
  autre: 'Autres',
};

/** « Adaptés aux boulangeries » */
export const CATEGORIE_PUBLIC: Record<Categorie, string> = {
  boulangerie: 'boulangeries',
  cafe: 'cafés',
  epicerie: 'épiceries',
  coiffure: 'salons de coiffure',
  pharmacie: 'pharmacies',
  autre: 'commerces',
};

export const RDV_STATUT_LABEL = {
  planifie: 'RDV planifié',
  realise: 'RDV réalisé',
  annule: 'RDV annulé',
} as const;

export const STATUT_LABEL: Record<StatutProspect, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  rdv_planifie: 'RDV planifié',
  client: 'Client',
  perdu: 'Perdu',
};

export const PRIORITE_LABEL: Record<Priorite, string> = {
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
};

export const HISTORIQUE_LABEL: Record<TypeHistorique, string> = {
  appel: 'Appel',
  visite: 'Visite en boutique',
  email: 'E-mail envoyé',
  note: 'Note',
  rdv: 'Rendez-vous',
  ajout: 'Prospect ajouté',
};

const nf = new Intl.NumberFormat('fr-FR');
export function formatNumber(n: number): string {
  return nf.format(n);
}

/** Distance à vol d'oiseau en mètres (formule de haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export function formatDateShort(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
}

export function formatMonthYear(iso: string): string {
  const s = new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMonthYearLower(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** « Ven. 16 oct. · 15h30 » */
export function formatRdvDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  return `${day.charAt(0).toUpperCase() + day.slice(1)} · ${time}`;
}

/** « Dans 2 jours », « Demain », « Aujourd'hui », « Il y a 3 jours » */
export function formatRelativeDays(iso: string): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date(iso)) - start(new Date())) / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days === -1) return 'Hier';
  return days > 0 ? `Dans ${days} jours` : `Il y a ${-days} jours`;
}

export function isThisWeek(iso: string): boolean {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
  const d = new Date(iso);
  return d >= monday && d < nextMonday;
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now();
}

/** Libellé d'activité : celui saisi à l'import s'il existe, sinon la famille. */
export function activiteLabel(p: { activite?: string | null; categorie: Categorie }): string {
  const a = p.activite?.trim();
  return a ? a.charAt(0).toUpperCase() + a.slice(1) : CATEGORIE_LABEL[p.categorie];
}
