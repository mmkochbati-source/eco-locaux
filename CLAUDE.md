# Eco-Locaux — front web

Eco-Locaux est un outil de prospection pour des commerciaux terrain qui vendent une offre d'énergie locale à des commerces de quartier (boulangeries, cafés, épiceries, coiffeurs, pharmacies). Plusieurs commerciaux l'utilisent, un secteur chacun ; chacun ne voit que ses prospects.

Ce dépôt contient le **front** uniquement. Le back-end (Supabase) et les automatisations (n8n, avec Claude comme étape IA) se branchent à l'étape suivante.

Lis `docs/SPEC_FRONT.md` avant de coder : il décrit chaque écran, les types de données et les états à gérer. Les maquettes de référence sont dans `design/` (`screen.png` pour le rendu, `code.html` pour les classes Tailwind exactes).

## Périmètre du MVP

Trois écrans maquettés : Recherche de prospects, Fiche prospect, Préparation du RDV. S'y ajoutent les éléments non maquettés listés dans `docs/SPEC_FRONT.md` (section « Éléments non maquettés »), et rien d'autre.

Hors périmètre, à ne pas construire :
- le bouton « Démarrer le RDV » (retiré volontairement) ;
- l'écran « Statistiques » (reporté après le MVP : ne pas l'afficher dans le menu) ;
- tout bouton, page, widget ou filtre absent des maquettes et de la spec.

Pourquoi : les maquettes générées par IA contiennent souvent des éléments en trop, et chaque élément construit est un élément à maintenir. Si une fonctionnalité te semble manquer ou superflue, pose la question avant de la construire.

## Stack

- React 18, Vite, TypeScript en mode strict
- Tailwind CSS v3 (reprendre la configuration des maquettes, voir « Design »)
- react-router-dom v6
- react-leaflet avec tuiles sombres CARTO pour la carte de recherche (gratuit, sans clé ; attribution OpenStreetMap / CARTO obligatoire)
- @supabase/supabase-js, installé mais **branché seulement à l'étape suivante**

## Architecture

```
src/
  main.tsx, App.tsx          routes
  index.css                  Tailwind + scrollbar
  types.ts                   types alignés sur les colonnes Supabase
  data/
    repository.ts            interface Repository + export du repo actif
    mockRepository.ts        données de démo en mémoire (+ localStorage)
    supabaseRepository.ts    squelette, implémenté à l'étape suivante
  components/                Layout, Sidebar, Topbar, Badge, ScoreRing, Modal…
  pages/                     Recherche, FicheProspect, PreparationRdv, RendezVous
```

Règle centrale : **les pages et composants n'accèdent aux données que via l'interface `Repository`**. Le choix de l'implémentation se fait avec la variable `VITE_DATA_SOURCE` (`mock` par défaut, `supabase` ensuite). Ainsi, brancher Supabase ne change aucun écran.

## Règles de données

- Le front n'appelle jamais Claude ni les API Google. Il lit et écrit dans Supabase, et déclenche des webhooks n8n (analyse de note, préparation de RDV, export PDF).
- Les chiffres métier (score, consommation, économies, répartition, percentile) sont **calculés côté back-end** et seulement affichés. Ne jamais les calculer dans le front : un chiffre faux, cité à un client, coûte au commercial sa crédibilité.
- Seule exception, l'affichage : la distance (calculée depuis la position du commercial ou, à défaut, le centre du secteur), le format des nombres et des dates.
- Le contenu produit par l'IA (tags, points clés, objections, questions) est une **suggestion** : le commercial peut le relire et le modifier, et une régénération demande confirmation si le commercial a modifié le contenu.
- Les traitements IA sont asynchrones (10 à 20 secondes) : l'écran affiche un état de chargement, puis se met à jour. Un échec s'affiche explicitement avec un bouton « Régénérer », jamais un écran vide.
- Dans le navigateur, seule la clé publique `anon` de Supabase existe. La clé `service_role` n'apparaît jamais dans le front ni dans un fichier versionné.
- Secrets et URLs dans `.env.local` (non versionné) ; fournir un `.env.example`.

## Conventions

- Textes de l'interface en français ; code (composants, fonctions, variables) en anglais.
- Les types TypeScript de `types.ts` reprennent exactement les noms de colonnes Supabase (snake_case, en français) pour éviter toute conversion.
- Thème sombre uniquement. Pas de bibliothèque de composants : des composants Tailwind simples suffisent.
- Chaque écran gère ses états : chargement, erreur, vide.
- Accessibilité de base : éléments interactifs en `button`/`a`, libellés sur les champs, focus visible.

## Design

Les trois maquettes Stitch utilisent des valeurs proches mais pas identiques. Les unifier en une seule configuration Tailwind :

| Rôle | Valeur |
| --- | --- |
| Accent (marque) | `#00d284` (survol `#05b774`) |
| Fond de page | `#090d12` |
| Fond sidebar / topbar | `#0d131a` |
| Fond de carte | `#111822` |
| Bordure | `#212d3d` (sidebar : `#1a2533`) |
| Texte | `slate-200` ; secondaire `slate-400` |
| Priorité haute | texte `amber-400`, fond `#332212`, bordure `#52391b` |
| Statut Nouveau | texte `#4f9eff`, fond `#1a2d42` |
| Statut Client | texte `#6b96ff`, fond `#1e2746` |
| Statut RDV planifié | texte `#00d284`, fond `#112d23` |
| Statut Contacté | texte `slate-300`, fond `#1d2736` |

Police : Inter (400, 500, 600, 700). Coins arrondis `rounded-xl` pour les cartes, `rounded-lg` pour les boutons. Les `screen.png` font foi pour le rendu final.

## Commandes

```
npm install
npm run dev       # développement
npm run build     # compile TypeScript puis build Vite
```

## Avant de dire « terminé »

1. `npm run build` passe sans erreur ni avertissement TypeScript.
2. Les trois écrans sont ouverts dans un navigateur à 1440 px et à 1024 px de large et comparés aux `screen.png`.
3. Le parcours complet fonctionne avec les données de démo : Recherche → Fiche → Planifier un RDV → Préparation (chargement puis contenu).
4. Rien ne figure dans l'interface qui ne soit pas dans les maquettes ou la spec.
