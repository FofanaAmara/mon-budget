# Feature Brief — Onboarding

## Section A — Fonctionnel

### Titre
Onboarding nouvel utilisateur

### Objectif utilisateur (Job-to-be-done)
En tant que nouvel utilisateur, je veux etre guide pour configurer mon budget initial (revenu, categories, objectif) pour commencer a utiliser l'app rapidement.

### Description
Overlay plein ecran en 3 etapes affiche pour les nouveaux utilisateurs (aucune donnee existante + localStorage flag absent). Etape 1 : saisir son revenu et frequence de paie. Etape 2 : choisir ses categories de depenses. Etape 3 : choisir son objectif principal. Alternative : charger des donnees de demo. Option : passer la configuration.

### Flows cles

1. **Etape 1 — Revenu** : Saisir montant + choisir frequence (hebdo/bi-hebdo/mensuel) -> apercu mensualise.
2. **Etape 2 — Categories** : Selectionner parmi 12 categories predefinies (grille 2 colonnes).
3. **Etape 3 — Objectif** : Choisir un objectif parmi 4 options (reduire depenses, epargner plus, suivre budget, atteindre objectif).
4. **Finaliser** : Appel completeOnboarding() -> cree les sections + revenu + localStorage flag -> redirect vers /.
5. **Demo** : Lien "explorer avec des donnees de test" -> loadDemoData() -> redirect vers /.
6. **Passer** : Lien "Passer la configuration" -> completeOnboarding() sans donnees -> redirect vers /.

### Criteres d'acceptation (niveau feature)
- AC-1 : L'onboarding s'affiche pour les nouveaux utilisateurs uniquement
- AC-2 : Les 3 etapes sont navigables (retour/suivant)
- AC-3 : Le revenu est mensualise correctement (hebdo * 4.33, bi-hebdo * 2.17)
- AC-4 : Les categories selectionnees sont creees comme sections
- AC-5 : Le chargement de demo fonctionne comme alternative
- AC-6 : L'onboarding peut etre passe

### Stories (squelette)
1. Detection nouvel utilisateur
2. Etape 1 : revenu
3. Etape 2 : categories
4. Etape 3 : objectif
5. Finalisation (creation donnees)
6. Alternative demo

### Dependances
- Depends on : Authentification, Gestion sections (creation)
- Used by : Tableau de bord (affichage conditionnel)

---

## Section B — Technique

### Source files
- `components/Onboarding.tsx`
- `lib/actions/onboarding.ts` : completeOnboarding
- `lib/actions/demo-data.ts` : loadDemoData

### Tables DB
- sections (creation depuis categories selectionnees)
- incomes (creation du revenu)

### Notes techniques
- Detection : isNewUser = !(await hasUserData()) && !localStorage('mes-finances-onboarding-done').
- L'overlay est z-index 9999, position fixed, couvre tout l'ecran.
- La mensualisation utilise : weekly * 4.33, biweekly * 2.17, monthly * 1.
