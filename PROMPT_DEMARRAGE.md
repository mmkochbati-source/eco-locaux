# Prompt de démarrage pour Claude Code

Ouvre ce dossier (`eco-locaux`) dans Claude Code, puis colle le message ci-dessous. Il démarre en mode plan : Claude te soumet son plan avant d'écrire du code, ce qui permet de corriger le tir tôt.

---

```text
Lis CLAUDE.md puis docs/SPEC_FRONT.md, et regarde les trois maquettes dans design/ (screen.png et code.html de chaque dossier).

Objectif : construire le front d'Eco-Locaux (3 écrans + les éléments non maquettés listés dans la spec), avec des données de démo, prêt à être branché à Supabase plus tard.

Avant d'écrire du code :
1. Résume en 5 lignes ce que tu as compris du produit et du périmètre (y compris ce qui est hors périmètre).
2. Propose ton plan en étapes, avec l'ordre de construction que tu recommandes.
3. Liste les points de la spec qui te semblent ambigus ou contradictoires avec les maquettes, et pose-moi tes questions. Les deux points de la section « À confirmer » comptent parmi eux.
Attends ma validation avant de coder.

Une fois validé, construis dans cet ordre, en vérifiant chaque étape dans le navigateur :
1. Projet Vite + React + TypeScript + Tailwind, configuration des couleurs unifiée, layout commun (sidebar, topbar).
2. types.ts, interface Repository et mockRepository avec les données de démo.
3. Écran Recherche (liste, filtres, carte).
4. Écran Fiche prospect.
5. Écran Préparation du RDV avec ses trois états (en cours, prêt, erreur), la fenêtre « Planifier un RDV » et la liste des rendez-vous.
6. Passe finale : états vide/erreur, rendu à 1440 px et 1024 px comparé aux screen.png, npm run build.

Contraintes à respecter à chaque étape :
- Aucune fonctionnalité qui ne figure ni dans les maquettes ni dans la spec.
- Aucun calcul de chiffres métier dans le front.
- Les pages passent uniquement par l'interface Repository.
- Fais-moi un point court à la fin de chaque étape, et signale tout écart par rapport aux maquettes.
```

---

## Après la construction

- Lancer `npm run dev` et parcourir : Recherche → Fiche du Fournil d'Antoine → Planifier un RDV → Préparation.
- Vérifier qu'il n'y a ni « Démarrer le RDV » ni « Statistiques » dans l'interface.
- Étape suivante (branchement) : créer les tables et la sécurité dans Supabase, écrire `supabaseRepository.ts`, puis connecter les webhooks n8n.
