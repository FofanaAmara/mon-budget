# Feature Brief — Notifications push

## Section A — Fonctionnel

### Titre
Notifications push (rappels de paiement)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux recevoir des rappels push avant mes echeances de paiement pour ne jamais oublier une facture.

### Description
Systeme de notifications push web via Service Worker. Composant NotificationPermission demande la permission au chargement de la page d'accueil. Endpoints API pour s'abonner et envoyer des notifications. Configuration des rappels par charge (reminder_offsets : jours avant echeance).

### Flows cles

1. **Permission** : Au premier chargement, NotificationPermission demande la permission push.
2. **Abonnement** : Si accepte, le SW s'enregistre et envoie la subscription au serveur via `/api/push/subscribe`.
3. **Envoi** : Un processus (ou cron externe) appelle `/api/push/send` pour envoyer les rappels bases sur reminder_offsets.
4. **Configuration** : Chaque charge a des reminder_offsets (ex: [3, 1, 0] = 3 jours, 1 jour, jour J).

### Criteres d'acceptation (niveau feature)

**AC-1 : Demande de permission**
- Given l'utilisateur arrive sur la page d'accueil
- When NotificationPermission se charge
- Then le navigateur demande la permission push (si pas encore accordee)

**AC-2 : Stockage abonnement**
- Given l'utilisateur accepte les notifications
- When le SW s'enregistre
- Then la subscription est envoyee a /api/push/subscribe et stockee en DB (push_subscriptions)

**AC-3 : Envoi rappels**
- Given une charge a des reminder_offsets (ex: [3, 1, 0])
- When un processus appelle /api/push/send
- Then les rappels sont envoyes X jours avant l'echeance

**AC-4 : Log des notifications**
- Given une notification est envoyee
- Then elle est logee dans notification_log pour eviter les doublons

### Stories (squelette)
1. Permission push + abonnement
2. Endpoint envoi de notifications
3. Configuration rappels par charge

### Dependances
- Depends on : Charges fixes (reminder_offsets), PWA (Service Worker)
- Used by : Aucune

---

## Section B — Technique

### Routes
- `/api/push/subscribe` (route.ts) — POST, enregistre la subscription
- `/api/push/send` (route.ts) — POST, envoie les notifications

### Source files
- `components/NotificationPermission.tsx`
- `app/api/push/subscribe/route.ts`
- `app/api/push/send/route.ts`
- `public/sw.js` — Service Worker

### Tables DB
- push_subscriptions (endpoint, keys, user_id)
- notification_log (tracking des envois)
- expenses (reminder_offsets, notify_push)
- settings (notify_push global)
