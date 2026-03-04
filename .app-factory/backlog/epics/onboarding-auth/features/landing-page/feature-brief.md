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

**AC-1 : Accessibilite sans authentification**
- Given un visiteur non connecte
- When il accede a /landing
- Then la page s'affiche sans redirection

**AC-2 : CTA fonctionnels**
- Given la page landing est chargee
- When l'utilisateur clique "Commencer gratuitement" ou "Creer mon budget"
- Then il est redirige vers /auth/sign-up
- When il clique "Connexion"
- Then il est redirige vers /auth/sign-in

**AC-3 : Responsive design**
- Given la page est chargee
- When elle est consultee sur mobile (< 768px) et desktop (>= 1024px)
- Then le layout s'adapte correctement (colonnes, tailles de police, espacement)

**AC-4 : Animations scroll**
- Given les sections marketing existent
- When l'utilisateur scroll vers le bas
- Then les sections apparaissent avec une animation de type scroll reveal

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
