import type { Categorie, Historique, Note, PreparationRdv, Profil, Prospect, RendezVous } from '../types';

// Données de démo : les 6 commerces de la maquette Recherche, fiche complète du Fournil d'Antoine.

export const DEMO_PROFIL: Profil = {
  nom: 'Camille Moreau',
  role: 'admin', // en démo, Camille voit aussi l'écran Pilotage de la direction
  secteur_id: 'sec-lyon-nord',
  initiales: 'CM',
  secteur_nom: 'Lyon Nord',
  centre: { lat: 45.772, lng: 4.836 },
  rayon_km: 1.5,
};

const base = {
  commercial_id: 'com-camille',
  secteur_id: 'sec-lyon-nord',
  google_place_id: null,
  site_web: null,
  activite: null,
  localisation: null,
  tags: [] as string[],
};

export const DEMO_PROSPECTS: Prospect[] = [
  {
    ...base,
    id: 'p-pharmacie-plateau',
    nom: 'Pharmacie du Plateau',
    categorie: 'pharmacie',
    adresse: '41 bd de la Croix-Rousse, Lyon 4e',
    lat: 45.775,
    lng: 4.8225,
    telephone: '04 78 28 14 52',
    horaires: { 'Lun–sam': '8h30–19h30' },
    gerant: 'Claire Dumas',
    email: 'contact@pharmacie-plateau.fr',
    surface_m2: 120,
    surface_production_m2: null,
    employes: 5,
    date_ouverture: '2009-09-01',
    echeance_contrat: '2028-01-01',
    statut: 'client',
    priorite: 'normale',
    niveau_interet: 'eleve',
    score_potentiel: 91,
    conso_estimee_mwh: 48,
    economies_estimees_eur: 3100,
    economies_pct: 15,
    conso_vs_moyenne_pct: 8,
    percentile_secteur: 5,
    repartition_conso: { froid: 34, eclairage: 30, autres: 36 },
  },
  {
    ...base,
    id: 'p-epicerie-saveurs',
    nom: 'Épicerie Bio Saveurs Locales',
    categorie: 'epicerie',
    adresse: '27 Grande Rue de la Croix-Rousse',
    lat: 45.7775,
    lng: 4.8332,
    telephone: '04 72 07 33 18',
    horaires: { 'Mar–sam': '9h–20h', Dim: '9h–13h' },
    gerant: null,
    email: null,
    surface_m2: 95,
    surface_production_m2: null,
    employes: 3,
    date_ouverture: '2019-04-01',
    echeance_contrat: null,
    statut: 'nouveau',
    priorite: 'haute',
    niveau_interet: null,
    score_potentiel: 88,
    conso_estimee_mwh: 41,
    economies_estimees_eur: 2700,
    economies_pct: 16,
    conso_vs_moyenne_pct: 19,
    percentile_secteur: 8,
    repartition_conso: { froid: 52, eclairage: 18, autres: 30 },
  },
  {
    ...base,
    id: 'p-fournil-antoine',
    nom: "Boulangerie Le Fournil d'Antoine",
    categorie: 'boulangerie',
    adresse: "14 rue d'Austerlitz, 69004 Lyon",
    lat: 45.7745,
    lng: 4.8333,
    telephone: '04 78 39 21 07',
    horaires: { 'Mar–sam': '6h30–19h30', Dim: '7h–13h', Lundi: 'fermé' },
    gerant: 'Antoine Lefèvre',
    email: 'contact@fournil-antoine.fr',
    surface_m2: 85,
    surface_production_m2: 40,
    employes: 6,
    date_ouverture: '2014-03-01',
    echeance_contrat: '2027-03-01',
    statut: 'contacte',
    priorite: 'haute',
    niveau_interet: 'eleve',
    score_potentiel: 82,
    conso_estimee_mwh: 62,
    economies_estimees_eur: 4200,
    economies_pct: 17,
    conso_vs_moyenne_pct: 24,
    percentile_secteur: 12,
    repartition_conso: { fours: 58, froid: 22, eclairage: 9, autres: 11 },
  },
  {
    ...base,
    id: 'p-cafe-halles',
    nom: 'Café des Halles',
    categorie: 'cafe',
    adresse: '3 place de la Croix-Rousse, Lyon 4e',
    lat: 45.776,
    lng: 4.833,
    telephone: '04 78 29 61 40',
    horaires: { 'Lun–sam': '7h–22h' },
    gerant: 'Karim Benali',
    email: 'cafedeshalles@orange.fr',
    surface_m2: 70,
    surface_production_m2: null,
    employes: 4,
    date_ouverture: '2016-06-01',
    echeance_contrat: '2026-12-01',
    statut: 'rdv_planifie',
    priorite: 'normale',
    niveau_interet: 'moyen',
    score_potentiel: 76,
    conso_estimee_mwh: 35,
    economies_estimees_eur: 2100,
    economies_pct: 14,
    conso_vs_moyenne_pct: 6,
    percentile_secteur: 21,
    repartition_conso: { froid: 38, eclairage: 22, autres: 40 },
  },
  {
    ...base,
    id: 'p-cave-tomme',
    nom: 'Fromagerie La Cave à Tomme',
    categorie: 'epicerie',
    adresse: "19 rue d'Ivry, Lyon 4e",
    lat: 45.783,
    lng: 4.83,
    telephone: '04 78 30 52 77',
    horaires: { 'Mar–sam': '9h–19h30' },
    gerant: 'Sophie Garnier',
    email: null,
    surface_m2: 55,
    surface_production_m2: null,
    employes: 2,
    date_ouverture: '2012-10-01',
    echeance_contrat: '2027-06-01',
    statut: 'contacte',
    priorite: 'normale',
    niveau_interet: 'moyen',
    score_potentiel: 71,
    conso_estimee_mwh: 29,
    economies_estimees_eur: 1600,
    economies_pct: 12,
    conso_vs_moyenne_pct: 11,
    percentile_secteur: 30,
    repartition_conso: { froid: 61, eclairage: 14, autres: 25 },
  },
  {
    ...base,
    id: 'p-meche-ciseaux',
    nom: 'Salon Mèche & Ciseaux',
    categorie: 'coiffure',
    adresse: "8 rue Dumont-d'Urville, Lyon 4e",
    lat: 45.778,
    lng: 4.828,
    telephone: '04 78 27 90 12',
    horaires: { 'Mar–sam': '9h–19h' },
    gerant: null,
    email: null,
    surface_m2: 45,
    surface_production_m2: null,
    employes: 3,
    date_ouverture: null,
    echeance_contrat: null,
    statut: 'nouveau',
    priorite: 'basse',
    niveau_interet: null,
    score_potentiel: 64,
    conso_estimee_mwh: 18,
    economies_estimees_eur: 900,
    economies_pct: 11,
    conso_vs_moyenne_pct: -4,
    percentile_secteur: 42,
    repartition_conso: { eclairage: 26, autres: 74 },
  },
];

export const DEMO_HISTORIQUE: Historique[] = [
  {
    id: 'h-fournil-4',
    prospect_id: 'p-fournil-antoine',
    type: 'appel',
    resume: "Intérêt confirmé. Veut comparer avec son contrat actuel avant de s'engager.",
    date: '2026-10-08T10:15:00',
  },
  {
    id: 'h-fournil-3',
    prospect_id: 'p-fournil-antoine',
    type: 'visite',
    resume: 'Rencontre avec Antoine. Compteur 36 kVA, deux fours électriques à sole.',
    date: '2026-10-02T15:00:00',
  },
  {
    id: 'h-fournil-2',
    prospect_id: 'p-fournil-antoine',
    type: 'email',
    resume: "Brochure « Pro Boulangerie » et étude de cas d'un artisan voisin.",
    date: '2026-09-25T09:30:00',
  },
  {
    id: 'h-fournil-1',
    prospect_id: 'p-fournil-antoine',
    type: 'ajout',
    resume: 'Identifié pendant la tournée Croix-Rousse.',
    date: '2026-09-18T11:00:00',
  },
  {
    id: 'h-cafe-1',
    prospect_id: 'p-cafe-halles',
    type: 'appel',
    resume: 'Rendez-vous calé avec Karim pour présenter l’offre.',
    date: '2026-10-06T16:20:00',
  },
  {
    id: 'h-pharma-1',
    prospect_id: 'p-pharmacie-plateau',
    type: 'visite',
    resume: 'Contrat signé. Point de suivi à prévoir après la première facture.',
    date: '2026-09-12T10:00:00',
  },
  {
    id: 'h-cave-1',
    prospect_id: 'p-cave-tomme',
    type: 'visite',
    resume: 'Chambre froide récente, intéressée par un prix fixe.',
    date: '2026-10-01T11:30:00',
  },
];

export const DEMO_NOTES: Note[] = [
  {
    id: 'n-fournil',
    prospect_id: 'p-fournil-antoine',
    texte:
      'Cuisson principale de 3h à 7h : bon candidat pour les heures creuses.\nAntoine décide seul, son épouse gère la compta.\nÉviter de passer entre 11h30 et 13h30.',
    statut_analyse: 'terminee',
    created_at: '2026-10-08T10:30:00',
  },
];

function inDays(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// RDV déjà planifiés ; leurs préparations sont prêtes (contenu générique).
export function buildDemoRendezVous(): RendezVous[] {
  return [
    { id: 'r-cafe-halles', prospect_id: 'p-cafe-halles', date_heure: inDays(1, 10, 0), duree_min: 45, statut: 'planifie' },
    { id: 'r-pharmacie', prospect_id: 'p-pharmacie-plateau', date_heure: inDays(2, 9, 30), duree_min: 30, statut: 'planifie' },
    { id: 'r-cave-tomme', prospect_id: 'p-cave-tomme', date_heure: inDays(3, 14, 0), duree_min: 45, statut: 'planifie' },
  ];
}

const CATEGORIE_PLURIEL: Record<Categorie, string> = {
  boulangerie: 'boulangeries',
  cafe: 'cafés',
  epicerie: 'épiceries',
  coiffure: 'salons de coiffure',
  pharmacie: 'pharmacies',
  autre: 'commerces',
};

type Contenu = Pick<PreparationRdv, 'trajet' | 'checklist' | 'points_cles' | 'objections'>;

let itemSeq = 0;
function items(libelles: string[]) {
  return libelles.map((libelle) => ({ id: `ci-${Date.now().toString(36)}-${itemSeq++}`, libelle, coche: false }));
}

// Contenu « généré par l'IA » : celui de la maquette pour le Fournil, générique sinon.
export function buildPreparationContent(prospect: Prospect): Contenu {
  if (prospect.id === 'p-fournil-antoine') {
    return {
      trajet: { voiture_min: 12, velo_min: 18 },
      checklist: {
        objectifs: items([
          'Valider le relevé de consommation des 12 derniers mois',
          "Obtenir l'accord pour un audit gratuit des fours",
        ]),
        documents: items([
          'Proposition tarifaire « Pro Boulangerie »',
          "Étude de cas d'un artisan-boulanger du 4e",
          'Mandat de changement de fournisseur pré-rempli',
        ]),
        questions: items([
          "Quelle est la date d'échéance exacte du contrat actuel ?",
          'À quelles heures tournent les fours la nuit ?',
          'Un nouvel équipement est-il prévu cette année ?',
        ]),
      },
      points_cles: [
        {
          titre: 'Les fours représentent 58 % de sa facture',
          detail: "Caler la cuisson de 3h à 7h sur les heures creuses : jusqu'à 2 100 €/an d'économies sur ce seul poste.",
        },
        {
          titre: 'Un prix fixe sur 3 ans',
          detail:
            "Le prix de la farine bouge déjà : l'énergie devient un coût prévisible, plus besoin de revoir ses tarifs en cours d'année.",
        },
        {
          titre: 'Une énergie produite dans la région',
          detail:
            'Un argument vitrine pour une clientèle de quartier attachée au local : macaron « Fournil alimenté en énergie locale » offert.',
        },
      ],
      objections: [
        {
          objection: "Je n'ai pas le temps de m'occuper d'un changement.",
          reponse:
            'On s’occupe de tout : 15 minutes pour signer, aucune coupure de courant, et nous gérons les démarches auprès de votre fournisseur actuel.',
          source: 'reference',
        },
        {
          objection: "Mon contrat court encore jusqu'en mars.",
          reponse:
            'Aucun problème : on signe maintenant et le changement se fait automatiquement à l’échéance, sans frais de résiliation.',
          source: 'reference',
        },
        {
          objection: "L'énergie verte, c'est forcément plus cher.",
          reponse:
            'Avec le prix fixe et le décalage de la cuisson en heures creuses, votre facture baisse : l’estimation tient compte de votre consommation réelle.',
          source: 'ia',
        },
      ],
    };
  }

  const pluriel = CATEGORIE_PLURIEL[prospect.categorie];
  return {
    trajet: { voiture_min: 10, velo_min: 15 },
    checklist: {
      objectifs: items(['Présenter l’offre d’énergie locale', 'Obtenir les factures des 12 derniers mois']),
      documents: items(['Proposition tarifaire', `Étude de cas d'un commerce similaire`, 'Mandat de changement de fournisseur']),
      questions: items([
        "Quelle est la date d'échéance du contrat actuel ?",
        'Quels sont les équipements les plus énergivores ?',
        'Qui prend la décision ?',
      ]),
    },
    points_cles: [
      {
        titre: 'Un prix fixe sur 3 ans',
        detail: 'Un coût de l’énergie prévisible, sans mauvaise surprise en cours d’année.',
      },
      {
        titre: 'Une énergie produite dans la région',
        detail: `Un argument apprécié par la clientèle de quartier des ${pluriel}.`,
      },
      {
        titre: 'Zéro démarche',
        detail: 'Le changement de fournisseur est pris en charge, sans coupure.',
      },
    ],
    objections: [
      {
        objection: "Je n'ai pas le temps de m'occuper d'un changement.",
        reponse:
          'On s’occupe de tout : 15 minutes pour signer, aucune coupure de courant, et nous gérons les démarches auprès de votre fournisseur actuel.',
        source: 'reference',
      },
      {
        objection: "L'énergie verte, c'est forcément plus cher.",
        reponse: 'Le prix fixe protège des hausses ; l’estimation est faite sur votre consommation réelle.',
        source: 'ia',
      },
    ],
  };
}
