# Prompt de branchement pour Claude Code (étape 4)

Colle le message ci-dessous dans Claude Code, dans le dossier `eco-locaux`. Avant de coller :
- Dans n8n, garde l'onglet ouvert : les URL de test ne répondent qu'une fois, après un clic sur « Execute workflow » du workflow concerné.

---

```text
Lis CLAUDE.md et docs/SPEC_FRONT.md. Le back-end est prêt : Supabase (tables, sécurité par ligne, calculs en base) et trois workflows n8n. Ta mission : brancher le front dessus, tester avec les URL de test n8n, puis me dire ce qui marche. Tu ne publies rien dans n8n : je m'en occupe une fois tes tests réussis.

## Informations de connexion (publiques, sans secret)
- VITE_SUPABASE_URL=https://hzlbhovkvmyceqpuuovb.supabase.co
- VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bGJob3Zrdm15Y2VxcHV1b3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NDM5MzEsImV4cCI6MjEwNzAxOTkzMX0.YhT1lylqQhJJaBXkOWL5p2zMUTRa-VsXAefEAByEwBA
- VITE_N8N_BASE_URL=https://oreegami.app.n8n.cloud
- VITE_N8N_WEBHOOK_PREFIX=webhook-test   (passera à "webhook" après publication)
- VITE_DATA_SOURCE=supabase
Mets-les dans .env.local (non versionné) et leurs noms dans .env.example. La clé service_role n'apparaît nulle part.

## Les trois webhooks (POST, JSON, en-tête `Authorization: Bearer <access_token Supabase de l'utilisateur connecté>`)
URL = {VITE_N8N_BASE_URL}/{VITE_N8N_WEBHOOK_PREFIX}/eco-locaux/<chemin>
1. importer-prospects  corps {"secteur_id": string, "categories": ["boulangerie"|"cafe"|"epicerie"|"coiffure"|"pharmacie"]}
   → 202. Les prospects apparaissent ensuite dans la table `prospects` (écoute Realtime).
2. analyser-note       corps {"note_id": uuid}
   → 202. `notes.statut_analyse` passe de en_cours à terminee (ou erreur), `notes.analyse_ia` est rempli, `prospects.tags` est enrichi.
3. preparer-rdv        corps {"rdv_id": uuid}
   → 202. `preparations_rdv.statut` passe de en_cours à pret (ou erreur) ; checklist, points_cles, objections sont remplis.
Réponse 403 = l'utilisateur n'a pas accès à cette ressource : affiche une erreur claire.
Le front n'attend pas le résultat de la requête : il écoute Supabase Realtime (tables prospects, notes, preparations_rdv).

## À construire
1. src/data/supabaseRepository.ts : implémente l'interface Repository existante (aucune page ne change). Les colonnes sont déjà en snake_case comme dans types.ts. Corrige types.ts : `lat` et `lng` sont nullables (number | null) ; masque ces prospects sur la carte mais garde-les dans la liste.
2. Page de connexion / inscription (email + mot de passe, Supabase Auth), garde de routes, bouton de déconnexion. Pas de maquette : reste sobre, dans le thème sombre existant.
3. Un petit module n8n (src/data/n8n.ts) qui appelle les trois webhooks avec le JWT ; abonnements Realtime pour passer de l'état « chargement » à l'état « contenu » ou « erreur » (bouton Régénérer).
4. Les données de démo restent disponibles avec VITE_DATA_SOURCE=mock.

## Tests avec les URL de test (dans cet ordre)
Pour chaque webhook : demande-moi d'abord de cliquer sur « Execute workflow » dans n8n (il n'écoute qu'une requête), puis déclenche l'action depuis le front.
1. Crée un compte via la page d'inscription. Vérifie que son profil est rattaché au secteur Lyon Nord (lis la table `profils`).
2. Import : lance l'import avec 2 catégories. Attendu : 202 puis des prospects dans la liste. Si Google Places refuse, note le message exact.
3. Note : ajoute une note sur un prospect (« Gérant absent, repasser mardi matin, contrat en cours jusqu'en mars »). Attendu : en_cours puis terminee, des tags apparaissent, aucun chiffre inventé.
4. RDV : planifie un RDV puis ouvre la préparation. Attendu : en_cours puis pret avec 2 à 4 questions, 3 points clés, 3 objections. Vérifie que chaque chiffre affiché vient bien de la fiche prospect.
5. Sécurité : appelle un webhook sans en-tête Authorization, puis avec l'identifiant d'une ressource d'un autre utilisateur. Attendu : 403 dans les deux cas.
6. Cas d'échec : une préparation en erreur affiche le message et le bouton Régénérer.

## Rapport attendu
Un tableau court : test, résultat (OK / KO), message d'erreur exact si KO. Pas de correction des workflows de ton côté : dis-moi ce qui échoue, je corrige côté n8n.
Quand tout est OK, ne change pas VITE_N8N_WEBHOOK_PREFIX : dis-moi « tests OK », je publie, puis tu passeras la valeur à "webhook" et tu referas un test rapide par webhook.
```

---

## Ce que je fais ensuite (côté n8n)
- Je publie les trois workflows dès que Claude Code rapporte « tests OK ».
- Les URL de production deviennent alors `/webhook/eco-locaux/...` (sans `-test`).
- WF4 (export PDF) reste à faire : il manque un service de génération de PDF.
