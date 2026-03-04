# Runbook: Deploy

## Quand utiliser
Deploiement en production sur Vercel.

## Pre-requis
- [ ] `npm run build` passe sans erreur
- [ ] Tous les changements commites et pushes
- [ ] Tests manuels valides en local

## Etapes

### 1. Build local
```bash
npm run build
```

### 2. Push vers main
```bash
git push origin main
```
Vercel deploie automatiquement depuis la branche `main`.

### 3. Verification post-deploy
- Verifier le dashboard Vercel pour le statut du deploy
- Tester la landing page en production
- Se connecter et verifier les fonctionnalites critiques

## Migrations DB
Les migrations Neon se font **manuellement** avant le deploy :
```bash
node scripts/migrate-xxx.mjs
```
**Attention** : Les migrations DB sont irreversibles. Toujours tester sur un branch Neon si disponible.

## Rollback
1. Depuis le dashboard Vercel, promouvoir le deploy precedent
2. Ou `git revert HEAD && git push` pour un revert rapide
