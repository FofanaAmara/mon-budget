# Feature Brief — Reclamation de donnees

## Section A — Fonctionnel

### Titre
Reclamation de donnees orphelines (migration pre-auth)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur qui avait des donnees avant l'ajout de l'authentification, je veux pouvoir recuperer mes donnees orphelines dans mon nouveau compte.

### Description
Banniere ClaimBanner affichee sur la page d'accueil si des donnees orphelines sont detectees (donnees sans user_id valide). Permet de les associer au compte connecte.

### Flows cles

1. **Detection** : Au chargement de la page d'accueil, hasOrphanedData() verifie si des donnees orphelines existent.
2. **Affichage banniere** : Si oui, une banniere s'affiche en haut de la page.
3. **Reclamation** : L'utilisateur clique pour associer les donnees a son compte.

### Criteres d'acceptation (niveau feature)
- AC-1 : La banniere s'affiche seulement si des donnees orphelines existent
- AC-2 : La reclamation associe les donnees au compte courant
- AC-3 : La banniere disparait apres la reclamation

### Stories (squelette)
1. Detection donnees orphelines
2. Banniere + action de reclamation

### Dependances
- Depends on : Authentification
- Used by : Aucune (feature de migration)

---

## Section B — Technique

### Source files
- `components/ClaimBanner.tsx`
- `lib/actions/claim.ts` : hasOrphanedData, claimOrphanedData, ensureDefaultSections

### Tables DB
- Toutes tables (verification user_id orphelin)
