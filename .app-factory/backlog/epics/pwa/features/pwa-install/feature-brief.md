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
- AC-1 : Le manifest.json est correctement configure (name, icons, theme_color, display: standalone)
- AC-2 : Le Service Worker est enregistre
- AC-3 : L'app est installable depuis Chrome/Safari
- AC-4 : Le favicon et les icones sont corrects

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
