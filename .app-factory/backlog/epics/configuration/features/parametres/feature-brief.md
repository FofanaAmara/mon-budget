# Feature Brief — Parametres

## Section A — Fonctionnel

### Titre
Hub des parametres et donnees

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux acceder a tous mes reglages (compte, preferences, gestion, donnees) depuis un point central, et pouvoir charger des donnees de demo ou vider mon compte.

### Description
Page `/parametres` : hub de navigation vers tous les reglages. Organise en groupes : Mon compte, Preferences (devise, rappels, notifications), Gestion (allocation, charges, revenus, cartes, sections), Donnees (charger demo, vider tout). Bouton deconnexion.

### Flows cles

1. **Naviguer** : Cliquer sur un item pour aller vers la page correspondante.
2. **Charger les donnees de demo** : Bouton -> loadDemoData() -> reload page. Disponible seulement si compte vide.
3. **Vider toutes les donnees** : Bouton -> confirmation modale -> clearAllUserData() -> redirect vers /.
4. **Se deconnecter** : Bouton -> authClient.signOut() -> redirect vers /auth/sign-in.

### Criteres d'acceptation (niveau feature)
- AC-1 : Tous les liens de navigation fonctionnent et menent aux bonnes pages
- AC-2 : Le chargement de demo est desactive si des donnees existent deja
- AC-3 : La suppression affiche une confirmation et est irreversible
- AC-4 : La deconnexion redirige vers la page de connexion

### Stories (squelette)
1. Hub de navigation
2. Chargement donnees de demo
3. Suppression de toutes les donnees
4. Deconnexion

### Dependances
- Depends on : Authentification
- Used by : Aucune (point d'entree vers toutes les configs)

---

## Section B — Technique

### Routes
- `/parametres` (page.tsx)
- `/parametres/devise` (page.tsx)
- `/parametres/rappels` (page.tsx)
- `/parametres/notifications` (page.tsx)

### Source files
- `app/parametres/page.tsx`
- `components/ParametresClient.tsx`

### Server actions
- `lib/actions/demo-data.ts` : loadDemoData, clearAllUserData, hasUserData
- `lib/auth/client.ts` : authClient.signOut()

### Tables DB
- settings (devise, rappels, notifications)
- Toutes tables (pour clearAllUserData)

### Sous-pages
- `/parametres/devise` : choix devise par defaut
- `/parametres/rappels` : rappels par defaut (offsets en jours)
- `/parametres/notifications` : toggle push/email/sms
- `/account/settings` : page compte Neon Auth
