# Enablers — Tech Debt identifiee

## Schema DB desynchronise
**Priorite** : Haute
**Description** : `supabase/schema.sql` ne reflete que le MVP initial. ~15 migrations manuelles ont ete appliquees sans mise a jour du schema de reference.
**Impact** : Pas de source de verite pour le schema actuel.
**Fix** : Regenerer `schema.sql` depuis la DB Neon en production, ou adopter un outil de migration (Drizzle, Prisma).

## Pas de tests automatises
**Priorite** : Moyenne
**Description** : Playwright installe mais 0 test ecrit. Aucun test unitaire.
**Impact** : Regressions non detectees, deployments risques.
**Fix** : Ecrire des tests E2E pour les parcours critiques (login, creer charge, marquer paye).

## Pas de CI/CD
**Priorite** : Moyenne
**Description** : Pas de `.github/workflows/`. Le deploy se fait par push direct sur main.
**Impact** : Pas de gate de qualite avant production.
**Fix** : Ajouter un workflow GitHub Actions (lint + build + test).

## Screenshots non-gitignored
**Priorite** : Basse
**Description** : ~200 fichiers `.png` de screenshots de debug a la racine du projet.
**Impact** : Repo bloat, confusion.
**Fix** : Ajouter `*.png` au `.gitignore` (hors `public/`) et nettoyer.
