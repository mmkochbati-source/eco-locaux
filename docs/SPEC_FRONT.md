# Spécification du front — Eco-Locaux

Source : maquettes Stitch (`design/`) et document « Étape 2 : Intégration de l'agent IA ». En cas de contradiction, ce fichier prévaut sur les maquettes.

## Routes

| Route | Écran | Maquette |
| --- | --- | --- |
| `/` | redirige vers `/recherche` | — |
| `/recherche` | Recherche de prospects | `eco_locaux_recherche_de_prospects` |
| `/prospects` | Mes prospects (même écran que Recherche, voir « À confirmer ») | — |
| `/prospects/:id` | Fiche prospect | `eco_locaux_fiche_prospect_…` |
| `/rendez-vous` | Liste des rendez-vous | non maquetté |
| `/rendez-vous/:id` | Préparation du RDV | `pr_paration_du_rendez_vous_…` |

Menu latéral : Recherche, Mes prospects (badge = nombre de prospects), Rendez-vous (badge = nombre de RDV à venir). **Pas de « Statistiques ».** Carte profil en bas : initiales, nom, secteur.

## Types (`src/types.ts`)

```ts
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
  horaires: Record<string, string> | null;       // ex. { "mar-sam": "6h30–19h30", "dim": "7h–13h" }
  gerant: string | null;
  email: string | null;
  surface_m2: number | null;
  surface_production_m2: number | null;          // ex. fournil 40 m²
  employes: number | null;
  date_ouverture: string | null;                 // ISO date
  echeance_contrat: string | null;               // ISO date (mois suffisant)
  statut: StatutProspect;
  priorite: Priorite;
  niveau_interet: NiveauInteret | null;
  score_potentiel: number;                       // 0–100, calculé en base
  conso_estimee_mwh: number | null;
  economies_estimees_eur: number | null;
  economies_pct: number | null;                  // à ajouter au schéma
  conso_vs_moyenne_pct: number | null;           // à ajouter au schéma
  percentile_secteur: number | null;             // à ajouter au schéma (« Top 12 % »)
  repartition_conso: { fours?: number; froid?: number; eclairage?: number; autres?: number } | null; // en %
  tags: string[];
}

export type TypeHistorique = 'appel' | 'visite' | 'email' | 'note' | 'rdv' | 'ajout';
export interface Historique { id: string; prospect_id: string; type: TypeHistorique; resume: string; date: string; }

export interface Note {
  id: string; prospect_id: string; texte: string;
  statut_analyse: 'aucune' | 'en_cours' | 'terminee' | 'erreur';
  created_at: string;
}

export interface RendezVous {
  id: string; prospect_id: string; date_heure: string; duree_min: number;
  statut: 'planifie' | 'realise' | 'annule';
}

export interface ChecklistItem { id: string; libelle: string; coche: boolean; }
export interface PreparationRdv {
  id: string; rdv_id: string;
  statut: 'en_cours' | 'pret' | 'erreur';
  trajet: { voiture_min: number; velo_min: number } | null;
  checklist: { objectifs: ChecklistItem[]; documents: ChecklistItem[]; questions: ChecklistItem[] };
  points_cles: { titre: string; detail: string }[];
  objections: { objection: string; reponse: string; source: 'reference' | 'ia' }[];
  genere_le: string | null;
  modifie_par_commercial: boolean;
}
```

Les trois colonnes « à ajouter au schéma » sont nécessaires pour afficher « +24 % vs moyenne », « −17 % sur la facture » et « Top 12 % du secteur » sans calcul dans le front.

## Interface `Repository` (`src/data/repository.ts`)

```ts
interface Repository {
  getProfil(): Promise<{ nom: string; initiales: string; secteur_nom: string; centre: { lat: number; lng: number }; rayon_km: number }>;
  listProspects(filters?: { categorie?: Categorie; statut?: StatutProspect; priorite?: Priorite; q?: string }): Promise<Prospect[]>;
  getProspect(id: string): Promise<Prospect>;
  createProspect(input: { nom: string; categorie: Categorie; adresse: string }): Promise<Prospect>;
  updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect>;
  listHistorique(prospectId: string): Promise<Historique[]>;
  addHistorique(prospectId: string, input: { type: TypeHistorique; resume: string }): Promise<Historique>;
  getNote(prospectId: string): Promise<Note | null>;
  saveNote(prospectId: string, texte: string): Promise<Note>;       // déclenche WF2 (analyse IA)
  listRendezVous(): Promise<(RendezVous & { prospect: Pick<Prospect, 'id' | 'nom' | 'categorie'> })[]>;
  createRendezVous(prospectId: string, date_heure: string): Promise<RendezVous>;  // déclenche WF3
  getRendezVous(id: string): Promise<RendezVous & { prospect: Prospect }>;
  getPreparation(rdvId: string): Promise<PreparationRdv>;
  subscribePreparation(rdvId: string, cb: (p: PreparationRdv) => void): () => void; // Realtime ; retourne la désinscription
  regeneratePreparation(rdvId: string): Promise<void>;              // WF3 à nouveau
  updatePreparation(rdvId: string, patch: Partial<Pick<PreparationRdv, 'checklist' | 'points_cles' | 'objections'>>): Promise<void>; // met modifie_par_commercial à true pour points_cles / objections
  exportPreparationPdf(rdvId: string): Promise<{ pdf_url: string | null }>; // WF4
}
```

**Comportement du `mockRepository`** : il simule le back-end pour que tout le parcours soit testable.
- Données de démo : les 6 commerces de la maquette Recherche (Pharmacie du Plateau 91, Épicerie Bio Saveurs Locales 88, Boulangerie Le Fournil d'Antoine 82, Café des Halles 76, Fromagerie La Cave à Tomme 71, Salon Mèche & Ciseaux 64), avec la fiche complète du Fournil d'Antoine telle que maquettée.
- `createRendezVous` crée une préparation `en_cours`, puis la passe à `pret` après environ 2 secondes avec le contenu de la maquette (Fournil) ou un contenu générique (autres commerces). `subscribePreparation` notifie ce changement. Prévoir aussi un moyen simple de simuler `erreur` (par exemple `?simulate=error` dans l'URL en développement).
- `saveNote` passe `statut_analyse` à `en_cours` puis `terminee` après environ 1,5 seconde et ajoute à `tags` les libellés des raccourcis présents dans le texte.
- Persistance en `localStorage` pour que les modifications survivent au rechargement.

## Écran 1 — Recherche de prospects

- **En-tête** : titre, sous-titre « N commerces dans votre secteur · communes », pastille « N rendez-vous cette semaine » (cliquable → `/rendez-vous`).
- **Barre de recherche** large (texte libre sur nom, rue, ville). Le raccourci ⌘K de la maquette n'est qu'un indicateur : il peut focaliser la recherche, sans palette de commandes.
- **Filtres** : pastilles de catégorie (Tous, Boulangeries, Cafés, Épiceries, Coiffure, Pharmacies), liste déroulante Statut, liste déroulante Priorité. Le sélecteur de zone « Lyon 4e · Croix-Rousse » de la maquette n'est pas un filtre à construire : afficher la zone du secteur en lecture seule.
- **Liste** : « N résultats · triés par potentiel » (tri par score décroissant ; le bouton « Trier » propose potentiel ou distance). Chaque carte : icône de catégorie, nom, « Catégorie · adresse », badges (statut, « Priorité haute » si applicable), distance, score `NN/100`, bouton « Voir la fiche ». La carte sélectionnée est mise en évidence (bordure verte).
- **Carte** (react-leaflet, tuiles sombres) : un marqueur par prospect, marqueur sélectionné mis en évidence, position du commercial en bleu, cercle pointillé du rayon du secteur, légende (Prospect, Vous, Rayon), zoom +/−, recentrage. Un clic sur une carte de la liste ou un marqueur sélectionne le prospect et affiche la fenêtre « nom, catégorie · distance, score, Voir la fiche ».
- **Topbar** : recherche globale (même champ que la barre large, ne pas dupliquer la logique), cloche de notifications, bouton « Nouveau prospect ».
- **États** : chargement (squelettes), vide (« Aucun commerce ne correspond à ces filtres » + réinitialiser), erreur (message + réessayer).

## Écran 2 — Fiche prospect

- **Fil d'Ariane** : « ← Résultats / Nom du commerce ».
- **En-tête** : icône, nom, badge statut, badge priorité, sous-titre « Catégorie détaillée · adresse · distance ». Actions : « Appeler » (`tel:`), « Itinéraire » (lien Google Maps avec l'adresse), « Planifier un RDV » (principal, ouvre la fenêtre de planification).
- **Carte score** : anneau `NN`, libellé selon le score (≥ 80 « Très bon », ≥ 65 « Bon », sinon « Moyen »), « Top N % du secteur » depuis `percentile_secteur`.
- **Informations clés** : gérant, téléphone, e-mail, horaires, surface (« 85 m² dont fournil 40 m² »), employés, ouverture, contrat actuel (échéance). Un bouton « Modifier » (non maquetté) bascule la carte en formulaire pour gérant, e-mail, surface, surface de production, employés, échéance du contrat. Téléphone et horaires viennent de Google et restent en lecture seule.
- **Historique** : chronologie (appel, visite, e-mail, ajout…) avec date et résumé, bouton « + Ajouter » (type + résumé). Triée de la plus récente à la plus ancienne.
- **Potentiel** : consommation (MWh/an + « +24 % vs moyenne »), économies possibles (€/an + « soit −17 % sur la facture »), niveau d'intérêt (barre à 5 segments : faible 2, moyen 3, élevé 4 ; libellé). Barre « Répartition estimée de la consommation » avec légende en pourcentages. Tout vient des champs du prospect.
- **Notes** : zone de texte, indicateur « Enregistré » / « Enregistrement… », raccourcis « + Préfère l'après-midi » et « + Décideur présent » qui ajoutent le libellé au texte, bouton « Enregistrer ». Après enregistrement, l'analyse IA s'exécute : afficher « Analyse en cours… » puis les tags obtenus sous forme de pastilles. Un échec d'analyse n'empêche pas la note d'être enregistrée.

## Écran 3 — Préparation du RDV

- **Fil d'Ariane** : « Fiche prospect / Préparation du rendez-vous ».
- **En-tête** : nom, badge « RDV planifié », « Avec {gérant}, gérant · catégorie · potentiel NN/100 ». Trois blocs : date et heure (avec « Dans N jours · durée »), adresse, trajet (« N min en voiture · N min à vélo »). Barre de progression « N/8 prêts » (cases cochées de la checklist). Boutons : « Exporter en PDF » et « Régénérer » (secondaire, non maquetté). **Pas de « Démarrer le RDV ».**
- **Checklist de préparation** : trois groupes (Objectifs du RDV, Documents à apporter, Questions à poser) avec compteur « n/m » ; cases cochables, libellé barré une fois coché ; enregistrement immédiat via `updatePreparation`.
- **Points clés à aborder** : cartes numérotées, titre + détail. Mention « Adaptés aux {catégorie} ».
- **Objections probables** : accordéon, la première ouverte. Contenu déplié : « Réponse suggérée » + texte. Afficher discrètement l'origine : « Réponse validée » (`source: reference`) ou « Suggestion IA » (`source: ia`).
- **États** : `en_cours` → squelettes et message « Préparation en cours… » (les infos du RDV restent visibles) ; `erreur` → « La génération a échoué » + « Régénérer » ; `pret` → contenu. Un clic sur « Régénérer » demande confirmation si `modifie_par_commercial` est vrai.
- **Export PDF** : appelle `exportPreparationPdf` ; avec le mock, ouvrir la boîte d'impression du navigateur avec une feuille de style `@media print` (fond blanc, menu masqué). Avec Supabase, ouvrir `pdf_url`.

## Éléments non maquettés (nécessaires, à garder minimaux)

1. **Fenêtre « Planifier un RDV »** : date et heure (`datetime-local`), durée par défaut 45 min, boutons Annuler / Planifier. Après validation : navigation vers `/rendez-vous/:id`.
2. **Fenêtre « Nouveau prospect »** : nom, catégorie, adresse. Le reste est enrichi par le back-end (Google Places).
3. **Écran « Rendez-vous »** : liste simple (commerce, date et heure, statut) triée par date, chaque ligne mène à la préparation. C'est le seul accès à l'écran Préparation en dehors de « Planifier un RDV ».
4. **Formulaire « Modifier »** des informations clés (voir écran 2) et formulaire « + Ajouter » de l'historique.
5. **Régénérer** et états d'erreur de la préparation (voir écran 3).

Aucune authentification dans cette étape : le mock expose un commercial fixe (Camille Moreau, secteur Lyon Nord). La connexion Supabase Auth est prévue à l'étape suivante.

## Décisions validées (14 oct. 2026)

- **« Mes prospects » vs « Recherche »** : `/prospects` réutilise l'écran Recherche en excluant les commerces au statut « nouveau ». Le badge du menu suit la même règle.
- **Carte** : react-leaflet avec tuiles sombres CARTO (Google Maps essayé puis abandonné : clé refusée ; solution libre retenue).
- **Contenu IA de la préparation** : seule la checklist est modifiable pour le MVP ; l'édition des points clés et objections est reportée.
- **Champs non typés des maquettes** (catégorie détaillée, « A demandé un devis », date d'estimation, durée d'appel, communes) : non affichés, aucune colonne ajoutée.
- **Planifier un RDV** ne modifie ni le statut du prospect ni l'historique.
- Distance calculée depuis le centre du secteur (pas de géolocalisation navigateur).
