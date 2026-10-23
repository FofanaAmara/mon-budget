# Session — 2026-10-23 — Sessions et livraison incertaine

**Plan :** `.Codex/plans/espaces-financiers-session-and-delivery.md`

## Objectif

Masquer les finances conservées sans session correspondante, puis documenter/tester la réconciliation sans renvoi aveugle. Exécution directe sans AWM ni question pendant absence.

## Journal

### Garde d’affichage

Identité serveur au layout ; garde client de session, contrôleur de document offline/historique/stockage sans PII, expiration sans focus. Déconnexion commune avant await, erreur SDK ne navigue plus comme un succès. Brouillons retirés avec contexte, message explicite et recharge complète. DEC-003 conserve ce compromis.

### Revue et quatrième chemin

La revue a trouvé Changer de compte via AuthView SIGN_OUT, qui naviguait dans finally. Vue contrôlée ajoutée avec retour d’invitation borné, strictmode et démontage. Source React vérifiée avec react-best-practices ; tests SSR ne remplacent pas recette navigateur. P2 fermé.

### Procédure opérateur

Runbook et SQL conditionnel de confirmation de livraison, préconditions fournisseur et intervention autorisée explicites. Trois tests PostgreSQL synthétiques prouvent les refus et invariants, dont invalidation de l’ancien lease. Aucun envoi, lecture de boîte ou correction de la recette/production.

## Résultat

222unit/95PG/29migrations-certificat-réconciliation verts ; types/lint et build Webpack en copie sans secrets verts ; gardes CI/matrice et profil/docs verts. Revue de tranche fermée. Les vraies sessions, email reçu, offline/onglets/BFCache, visuelMCP et CI distante restent ouverts ; aucun verdict global acquis.

## Fichiers modifiés

Layout financier et providerAuth, routesAuth, vues/contrôleur/helper de session/signout, trois boutons, validateur partagé, tests TSX et config Vitest, statement/runbook et testPG, scriptpackage/profil, décision/preuves/matrice/mémoire/suivi. Changements humains préexistants conservés.
