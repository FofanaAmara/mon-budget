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

**AC-1 : Detection nouvel utilisateur**
- Given un utilisateur vient de s'inscrire (aucune donnee ET pas de localStorage flag)
- When il arrive sur la page d'accueil
- Then l'overlay onboarding s'affiche en plein ecran

**AC-2 : Navigation 3 etapes**
- Given l'onboarding est affiche
- When l'utilisateur navigue entre les etapes
- Then il peut aller en avant (Suivant) et en arriere (Retour)
- And chaque etape est : 1. Revenu 2. Categories 3. Objectif

**AC-3 : Mensualisation du revenu**
- Given l'utilisateur saisit un revenu
- When la frequence est "hebdo" → montant * 4.33
- When la frequence est "bi-hebdo" → montant * 2.17
- When la frequence est "mensuel" → montant * 1
- Then l'apercu mensualise s'affiche en temps reel
- **Edge case** : le multiplicateur 2.17 (onboarding) vs 26/12=2.1667 (generation mensuelle) — incoherence

**AC-4 : Creation des sections**
- Given l'utilisateur selectionne des categories
- When il finalise l'onboarding
- Then les categories selectionnees sont creees comme sections
- And les sections par defaut (creees par ensureDefaultSections) sont supprimees et remplacees

**AC-5 : Alternative demo**
- Given l'onboarding est affiche
- When l'utilisateur clique "explorer avec des donnees de test"
- Then loadDemoData est appele et l'app se recharge

**AC-6 : Passer la configuration**
- Given l'onboarding est affiche
- When l'utilisateur clique "Passer la configuration"
- Then completeOnboarding est appele sans donnees significatives
- And le localStorage flag est pose
- And l'utilisateur est redirige vers /

**AC-7 : Onboarding ne s'affiche qu'une fois**
- Given l'onboarding a ete complete (localStorage flag = true)
- When l'utilisateur revient sur la page d'accueil
- Then l'onboarding ne s'affiche plus

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
