# Feature Brief — Landing page

## Section A — Fonctionnel

### Titre
Page d'atterrissage marketing

### Objectif utilisateur (Job-to-be-done)
En tant que visiteur, je veux comprendre ce que fait Mes Finances, voir ses avantages, et pouvoir m'inscrire ou me connecter facilement.

### Description
Page `/landing` : page marketing complete avec hero, proposition de valeur, fonctionnalites, temoignage, CTA final, footer. Navigation fixe avec logo et boutons Connexion/Commencer. Design responsive mobile-first.

### Flows cles

1. **Decouvrir** : Hero avec slogan "Tes finances. En clair.", monument 847$, CTA "Commencer gratuitement".
2. **Comprendre** : Sections "Pourquoi Mes Finances" (3 chiffres), "Comment ca marche" (3 etapes), "Fonctionnalites" (6 cartes).
3. **Etre convaincu** : Temoignage client avec etoiles.
4. **Passer a l'action** : CTA final "Creer mon budget" -> /auth/sign-up.

### Criteres d'acceptation (niveau feature)
- AC-1 : La page est accessible sans authentification
- AC-2 : Les CTA menent vers /auth/sign-up (inscription) et /auth/sign-in (connexion)
- AC-3 : La page est responsive (mobile + desktop)
- AC-4 : Animations scroll reveal sur les sections

### Stories (squelette)
1. Hero + navigation
2. Sections marketing
3. CTA + footer

### Dependances
- Depends on : Authentification (liens)
- Used by : Aucune

---

## Section B — Technique

### Routes
- `/landing` (page.tsx) — Server component (statique)

### Source files
- `app/landing/page.tsx`
- `components/landing/ScrollReveal.tsx`

### Notes techniques
- Page statique, pas de data fetching.
- Metadata SEO definie.
- Utilise des ScrollReveal pour les animations d'apparition au scroll.
