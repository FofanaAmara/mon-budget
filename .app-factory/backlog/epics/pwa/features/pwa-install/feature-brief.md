# Feature Brief — PWA (Progressive Web App)

## Section A — Fonctionnel

### Titre
Installation PWA et experience hors ligne

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur mobile, je veux installer l'app sur mon ecran d'accueil et avoir une experience native (splash screen, icone, plein ecran).

### Description
Configuration PWA avec manifest.json, Service Worker, icones. L'app peut etre installee sur l'ecran d'accueil (Android/iOS). Mode standalone (pas de barre d'adresse). Splash screen avec logo et couleurs de la marque.

### Flows cles

1. **Installation** : Le navigateur propose l'installation (banniere A2HS ou prompt).
2. **Experience native** : L'app s'ouvre en plein ecran, sans barre d'adresse, avec la couleur de theme.
3. **Icone** : L'icone de l'app apparait sur l'ecran d'accueil.

### Criteres d'acceptation (niveau feature)

**AC-1 : Manifest correct**
- Given le fichier manifest.json existe
- Then il contient : name, short_name, icons (multiples tailles), theme_color, background_color, display: standalone, start_url

**AC-2 : Service Worker enregistre**
- Given l'app est chargee
- When le navigateur supporte les SW
- Then sw.js est enregistre

**AC-3 : Installabilite**
- Given manifest + SW sont correctement configures
- When l'utilisateur visite l'app sur Chrome/Safari
- Then le navigateur propose l'installation (A2HS)

**AC-4 : Favicon et icones**
- Given les fichiers favicon.ico et icon-*.png existent
- Then ils sont correctement references dans le HTML
- **Edge case** : cache PWA peut afficher un ancien favicon meme apres mise a jour (BUG connu)

### Stories (squelette)
1. Manifest + icones
2. Service Worker registration
3. Theme + splash screen

### Dependances
- Depends on : Aucune
- Used by : Notifications push (Service Worker)

---

## Section B — Technique

### Source files
- `public/manifest.json`
- `public/sw.js`
- `public/favicon.ico`, `public/icon-*.png`
- `app/layout.tsx` (meta tags PWA)

### Notes techniques
- Pas de support offline complet actuellement (pas de cache strategy pour les pages).
- Le SW est principalement utilise pour les push notifications.
