# Plan — Phase 2 : Revenus, Notifications & Vue Cartes
**Projet** : Mon Budget PWA
**Phase PRD** : Phase 2 — "Cette semaine"
**Date** : 26 février 2026
**Statut** : En attente de validation

---

## Executive Summary

**En bref** :
- Ajouter sur l'app MVP (Phase 1 livrée) : revenus, vue "reste à vivre", notifications email/SMS, cron Vercel automatique, vue dédiée par carte
- Nouveaux services : Resend (email) + Twilio (SMS) + Vercel Cron
- Livrable : Phase 2 deployée sur Vercel, testée E2E avec Playwright, 100% fonctionnelle

**Contexte** : La Phase 1 (MVP) est livrée et fonctionnelle. Amara peut gérer ses dépenses mais n'a pas encore de vue sur ses revenus, pas de rappels automatiques, et pas de notifications email/SMS.

**Objectif** : Compléter le cycle de notification (push + email + SMS), automatiser les rappels quotidiens via Vercel Cron, ajouter la gestion des revenus et la vue "reste à vivre", et afficher une vue consolidée par carte.

**Approche** : 4 étapes internes (revenus → notifications multi-canal → cron → tests Playwright), chacune validée avant de passer à la suivante.

**Impact** : ~15 nouveaux fichiers créés, ~5 fichiers existants modifiés (dashboard, parametres, sw.js, schema Supabase).

---

## Current State

**Description** : Phase 1 livrée et fonctionnelle sur Vercel.

- CRUD sections, cartes, dépenses (RECURRING + ONE_TIME) opérationnel
- Dashboard : prochaines dépenses 7j + total par section + alertes
- Web Push fonctionnel (permission + subscription + envoi manuel)
- PWA installable iOS 16.4+
- 10/10 tests Playwright Phase 1 verts

**Ce qui manque** :
- Aucun revenu saisi → pas de calcul "reste à vivre"
- Notifications uniquement manuelles → pas de rappels automatiques
- Pas d'email ni SMS → push seulement
- Pas de vue consolidée par carte de paiement
- Cron Vercel non configuré

**Artefacts existants** :
- Projet Next.js 15 déployé sur Vercel
- Supabase : tables `sections`, `cards`, `expenses`, `settings`, `notification_log`, `push_subscriptions`
- `lib/supabase/`, `lib/utils.ts`, `lib/push.ts`
- `tests/phase1/` — 10 tests verts

---

## Future State

**Description** : Phase 2 complète sur Vercel, testée Playwright.

**Critères mesurables** :
- CRUD revenus fonctionnel avec normalisation mensuelle correcte
- Dashboard affiche : Revenus − Dépenses = Reste à vivre (coloré vert/rouge)
- Email de rappel reçu dans la boîte de Amara lors d'un test
- SMS de rappel reçu sur le téléphone de Amara lors d'un test
- Cron Vercel visible dans Vercel Dashboard > Cron Jobs, exécuté quotidiennement
- Page `/cartes/[id]` : liste des dépenses auto-chargées + total mensuel par carte
- `npx playwright test tests/phase2/` : **12/12 ✅** sur URL Vercel prod

**Livrables attendus** :
- `app/revenus/` — CRUD revenus
- `app/api/notify/email/route.ts` — Resend
- `app/api/notify/sms/route.ts` — Twilio
- `app/api/cron/reminders/route.ts` — Cron quotidien
- `app/cartes/[id]/page.tsx` — Vue par carte
- `vercel.json` mis à jour avec cron config
- `supabase/migration-phase2.sql` — table `incomes` + colonne VAPID si manquante
- `tests/phase2/*.spec.ts` — 12 tests Playwright

---

## Gap Analysis

| # | Gap | État actuel | État cible | Comment combler |
|---|-----|-------------|------------|-----------------|
| 1 | Table `incomes` Supabase | Inexistante | Table avec id, name, amount, frequency, is_active | Migration SQL + RLS |
| 2 | CRUD Revenus | Inexistant | Page `/revenus` avec CRUD + normalisation mensuelle | Page + Server Actions |
| 3 | "Reste à vivre" | Dashboard sans revenus | Dashboard affiche Revenus − Dépenses avec couleur | Widget dashboard mis à jour |
| 4 | Email (Resend) | Inexistant | Route POST `/api/notify/email` + template rappel | Resend SDK + route API |
| 5 | SMS (Twilio) | Inexistant | Route POST `/api/notify/sms` + message court | Twilio SDK + route API |
| 6 | Cron automatique | Inexistant | Vercel Cron 9h UTC → `/api/cron/reminders` | vercel.json + route cron |
| 7 | Logique rappels cron | Inexistante | Query expenses avec next_due_date dans X jours → envoie notifs activées → log | Route `/api/cron/reminders` complète |
| 8 | Message rappel différencié | Inexistant | "Auto-chargé sur Visa ***4532" vs "À payer manuellement" | Logique dans la route cron |
| 9 | Vue par carte | Inexistante | Page `/cartes/[id]` : dépenses + total mensuel | Page avec query filtrée |
| 10 | Settings Phase 2 | Email/téléphone non saisis | Page parametres avec champs email + téléphone + test notif | Mise à jour page parametres |
| 11 | Tests Playwright Phase 2 | Inexistants | 12 tests verts sur Vercel | `tests/phase2/` |

---

## Impact Analysis

### Fichiers à créer

| Fichier | Type | Raison |
|---|---|---|
| `supabase/migration-phase2.sql` | CREATE | Table `incomes` |
| `lib/actions/incomes.ts` | CREATE | Server Actions revenus |
| `app/revenus/page.tsx` | CREATE | CRUD revenus |
| `app/api/notify/email/route.ts` | CREATE | Envoi email Resend |
| `app/api/notify/sms/route.ts` | CREATE | Envoi SMS Twilio |
| `app/api/cron/reminders/route.ts` | CREATE | Cron job quotidien |
| `lib/notifications.ts` | CREATE | Helpers : buildMessage, sendAllChannels |
| `app/cartes/[id]/page.tsx` | CREATE | Vue par carte |
| `tests/phase2/*.spec.ts` | CREATE | 12 tests Playwright |

### Fichiers à modifier

| Fichier | Type | Raison |
|---|---|---|
| `app/page.tsx` (dashboard) | UPDATE | Ajouter widget "Reste à vivre" |
| `app/parametres/page.tsx` | UPDATE | Ajouter champs email, téléphone, bouton test notif |
| `app/cartes/page.tsx` | UPDATE | Ajouter lien vers `/cartes/[id]` |
| `vercel.json` | UPDATE | Ajouter cron `0 9 * * *` |
| `lib/database.types.ts` | UPDATE | Régénérer après migration (table `incomes`) |

### Dépendances externes à provisionner

| Service | Action requise | Clés nécessaires |
|---|---|---|
| Resend | Créer compte + API key (free : 3000 emails/mois) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Twilio | Créer compte + numéro CA + vérifier numéro test | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |

### Blast Radius

**Niveau** : MEDIUM — modifications ciblées sur dashboard + parametres + vercel.json. Risque : email/SMS échouent silencieusement si clés Vercel manquantes.

---

## Scope Boundaries

### IN SCOPE
1. **CRUD Revenus** : créer, modifier, supprimer revenus avec fréquence (MONTHLY/BIWEEKLY/YEARLY)
2. **Vue "reste à vivre"** : Revenus − Dépenses sur le dashboard
3. **Email Resend** : route API + template rappel + configuration par dépense
4. **SMS Twilio** : route API + message court + configuration par dépense
5. **Cron Vercel** : 1 fois par jour, vérifie les rappels à envoyer
6. **Notification_Log** : log de chaque envoi (canal, statut, timestamp)
7. **Vue par carte** : `/cartes/[id]` avec dépenses filtrées + total mensuel
8. **Settings mis à jour** : email, téléphone, bouton "Tester les notifications"
9. **12 tests Playwright** sur Vercel

### OUT OF SCOPE
1. ~~Type PLANNED (dépenses planifiées)~~ → Phase 3
2. ~~Historique / tendances mensuelles~~ → Phase 3
3. ~~Export de données~~ → Phase 3
4. ~~Multi-utilisateur / auth~~ → hors scope PRD
5. ~~SMS groupés / campagnes~~ → hors scope

### Critères d'arrêt
- [ ] Tâche non listée > 30 min → documenter, ne pas faire
- [ ] Tenter de "refactorer" le code Phase 1 → ne pas toucher
- [ ] Ajouter fonctionnalité Phase 3 "en passant" → refuser

---

## Assumptions

| Hypothèse | Risque si fausse | Comment valider |
|---|---|---|
| Resend free tier (3000 emails/mois) suffisant | Limite atteinte | Usage mono-user : ~30 emails/mois max |
| Twilio disponible pour numéros CA | SMS non envoyés | Vérifier lors de la création du compte Twilio |
| Vercel Cron disponible sur free tier (1 job, 1x/jour max) | Cron non déclenché | Vérifier Vercel docs free tier limits |
| `reminder_offsets` déjà stockés dans `expenses` (Phase 1) | Logique cron incomplète | Vérifier schema `expenses` → colonne `reminder_offsets int[]` |
| `notify_email` et `notify_sms` colonnes présentes dans `expenses` (Phase 1) | Cron ne sait pas quoi envoyer | Vérifier schema, sinon migration simple |
| Cron Vercel passe `CRON_SECRET` en header pour sécuriser la route | Route publiquement accessible | Implémenter vérification du secret dans `/api/cron/reminders` |

---

## Pre-Mortem

> "On est dans 3 jours. La Phase 2 n'est pas livrée. Pourquoi ?"

| Scénario | Probabilité | Impact | Prévention |
|---|---|---|---|
| Clés Resend/Twilio non ajoutées sur Vercel → envois silencieux | HAUTE | Notifications cassées | Checklist env vars avant deploy Phase 2 |
| Cron Vercel non supporté sur free tier | MOYENNE | Rappels non automatiques | Ajouter bouton "Déclencher manuellement" dans /parametres comme fallback |
| SMS Twilio : numéro CA non disponible | MOYENNE | SMS non envoyés | Prévoir fallback : désactiver SMS si numéro indisponible, informer Amara |
| `notification_log` non utilisé → pas de déduplication | MOYENNE | Envois en double | Vérifier dans cron : `WHERE NOT EXISTS (SELECT 1 FROM notification_log WHERE expense_id = ? AND scheduled_for = ?)` |
| Twilio trial account : SMS envoyés uniquement à des numéros vérifiés | HAUTE | SMS ne partent pas | Vérifier numéro de test dans console Twilio avant de coder |

---

## Rollback Strategy

| Situation | Action |
|---|---|
| Migration Supabase échoue | Exécuter SQL de rollback (`DROP TABLE incomes`) |
| Cron casse l'app | Retirer le cron de `vercel.json` + redeploy |
| Email/SMS cassés | Désactiver les routes dans `/parametres` sans toucher le reste |
| Dashboard "reste à vivre" faux | `git revert` du widget uniquement |

---

## Implementation Plan

### Étape 1 — Revenus & "Reste à vivre"
**Objectif** : Gérer les revenus et afficher le solde disponible sur le dashboard.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 1.1 | `supabase/migration-phase2.sql` : créer table `incomes` + RLS + régénérer types TypeScript | Phase 1 ✅ | Table visible dans Supabase |
| 1.2 | `lib/actions/incomes.ts` : `createIncome`, `updateIncome`, `deleteIncome` | 1.1 | CRUD fonctionnel |
| 1.3 | `lib/utils.ts` : `normalizeToMonthly(amount, frequency)` → MONTHLY×1, BIWEEKLY×26/12, YEARLY÷12 | — | Calculs corrects |
| 1.4 | `app/revenus/page.tsx` : liste des revenus avec montant mensuel normalisé + total + CRUD | 1.2, 1.3 | Ajouter "Salaire 5000$/mois" → visible, total correct |
| 1.5 | Ajouter onglet "Revenus" dans `BottomNav` (ou dans /parametres selon espace) | 1.4 | Navigation accessible |
| 1.6 | Dashboard : requête `getTotalMonthlyIncome()` + widget "Reste à vivre" = Revenus − Dépenses (vert si positif, rouge si négatif) | 1.3 | Chiffre correct, couleur adaptée |

**Checkpoint** : Ajouter revenu → total dashboard mis à jour → "reste à vivre" affiché correctement ✅

---

### Étape 2 — Notifications Email & SMS
**Objectif** : Routes API email (Resend) et SMS (Twilio) fonctionnelles et testées.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 2.1 | Ajouter env vars Vercel : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | — | Variables visibles dans Vercel Dashboard |
| 2.2 | Installer dépendances : `npm install resend twilio` | — | `npm run build` passe |
| 2.3 | `app/api/notify/email/route.ts` (Node.js runtime) : POST avec `{to, expenseName, amount, dueDate, isAutoCharged, cardName}` → Resend sendEmail | 2.1, 2.2 | Email reçu dans boîte Amara lors du test |
| 2.4 | `app/api/notify/sms/route.ts` (Node.js runtime) : POST avec même payload → Twilio messages.create → SMS court | 2.1, 2.2 | SMS reçu sur téléphone Amara lors du test |
| 2.5 | `lib/notifications.ts` : `buildReminderMessage(expense, daysUntil)` → texte différencié selon `is_auto_charged` et `card_name` | — | Textes corrects selon les cas |
| 2.6 | Mise à jour `app/parametres/page.tsx` : champs email + téléphone + bouton "Envoyer notification test" → appelle `/api/notify/email` + `/api/notify/sms` | 2.3, 2.4 | Sauvegarder → tester → recevoir notif |

**Checkpoint** : Email reçu ✅ — SMS reçu ✅ — Messages différenciés (auto vs manuel) ✅

---

### Étape 3 — Cron Vercel & Notification_Log
**Objectif** : Cron quotidien automatique qui envoie les rappels et les trace.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 3.1 | Ajouter `CRON_SECRET` dans env vars Vercel (valeur aléatoire sécurisée) | — | Var présente |
| 3.2 | `app/api/cron/reminders/route.ts` : vérifier header `Authorization: Bearer CRON_SECRET` → query `expenses` WHERE `next_due_date` IN (`today + offset` pour chaque `reminder_offset`) AND `is_active = true` → pour chaque expense, envoyer push/email/sms selon flags → insérer dans `notification_log` | Étapes 1, 2 | Exécution manuelle GET → 200, logs créés |
| 3.3 | Logique déduplication dans cron : vérifier `notification_log` avant envoi (éviter doublons si cron run 2x) | 3.2 | 2 exécutions consécutives → pas de doublons dans logs |
| 3.4 | `vercel.json` : ajouter `"crons": [{"path": "/api/cron/reminders", "schedule": "0 9 * * *"}]` | 3.2 | Cron visible dans Vercel Dashboard > Cron Jobs |
| 3.5 | Commit + deploy → vérifier cron dans Vercel Dashboard | 3.4 | Job apparaît dans la liste, next run affiché |

**Checkpoint** : Test manuel de `/api/cron/reminders` → push + email + SMS reçus ✅ — `notification_log` alimenté ✅ — Cron visible sur Vercel ✅

---

### Étape 4 — Vue par Carte
**Objectif** : Page dédiée par carte de paiement.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 4.1 | `app/cartes/[id]/page.tsx` : query `expenses WHERE card_id = [id] AND is_auto_charged = true AND is_active = true` + calcul total mensuel | Phase 1 ✅ | Page se charge avec les bonnes dépenses |
| 4.2 | Affichage : en-tête carte (nom + type + last_four), liste dépenses avec montant mensuel, total mensuel en bas | 4.1 | Mise en page correcte |
| 4.3 | Mise à jour `app/cartes/page.tsx` : chaque carte affiche son total mensuel + lien vers `/cartes/[id]` | 4.2 | Total par carte correct depuis la liste |

**Checkpoint** : Vue `/cartes/[id]` affiche les bonnes dépenses avec total correct ✅

---

### Étape 5 — Tests Playwright Phase 2
**Objectif** : 12 tests E2E verts sur l'URL Vercel de production.

| # | Test | Ce qui est vérifié |
|---|------|---------------------|
| 5.1 | `test-revenus.spec.ts` | Créer revenu mensuel 5000$ → total mensuel correct → "reste à vivre" mis à jour sur dashboard |
| 5.2 | `test-revenus-multifreq.spec.ts` | Revenu bimensuel 2500$ → normalisation correcte (2500×26/12 = 5416$/mois) |
| 5.3 | `test-solde-dashboard.spec.ts` | Dashboard affiche : Revenus / Dépenses / Reste à vivre — couleurs correctes (vert si positif, rouge si négatif) |
| 5.4 | `test-email-route.spec.ts` | POST `/api/notify/email` avec payload test → 200 + email reçu (vérification via Resend logs) |
| 5.5 | `test-sms-route.spec.ts` | POST `/api/notify/sms` avec payload test → 200 (Twilio logs) |
| 5.6 | `test-cron-manual.spec.ts` | GET `/api/cron/reminders` avec Authorization header → 200 + `notification_log` alimenté |
| 5.7 | `test-cron-dedup.spec.ts` | 2 exécutions cron → pas de doublon dans `notification_log` |
| 5.8 | `test-cron-message.spec.ts` | Dépense auto-chargée → message contient "auto-chargé sur [carte]". Dépense manuelle → "à payer manuellement" |
| 5.9 | `test-vue-carte.spec.ts` | Page `/cartes/[id]` : dépenses filtrées par carte, total mensuel correct |
| 5.10 | `test-vue-cartes-list.spec.ts` | Page `/cartes` : chaque carte affiche son total mensuel |
| 5.11 | `test-parametres-notif.spec.ts` | Sauvegarder email + téléphone → persistés. Bouton test → notif déclenchée |
| 5.12 | `test-phase1-regression.spec.ts` | Re-exécuter les 10 tests Phase 1 → tous encore verts (non-régression) |

**Checkpoint Final Phase 2** : `npx playwright test tests/phase2/` → **12/12 ✅** sur Vercel prod. Tous les tests Phase 1 toujours verts (non-régression).

---

## Success Criteria

**Par étape** :
- Étape 1 : Revenus CRUD ✅ — "Reste à vivre" affiché correctement sur dashboard ✅
- Étape 2 : Email reçu ✅ — SMS reçu ✅ — Messages différenciés ✅
- Étape 3 : Cron Vercel visible ✅ — Déduplication OK ✅ — Logs créés ✅
- Étape 4 : Vue par carte correcte ✅
- Étape 5 : **12/12 tests Phase 2 + 10/10 tests Phase 1 verts** ✅

**Critères PRD Phase 2** :
- [ ] Revenus + vue "reste à vivre" — ✅
- [ ] Notifications email (Resend) — ✅
- [ ] Notifications SMS (Twilio) — ✅
- [ ] Cron Vercel automatique quotidien — ✅
- [ ] Vue par carte — ✅

---

## Testing Strategy

| Type | Ce qui est testé | Comment | Quand |
|---|---|---|---|
| Build | TypeScript compile | `npm run build` | Fin de chaque étape |
| Intégration Supabase | Table `incomes`, RLS | SQL Editor + logs | Étape 1 |
| Intégration Resend | Email livré | Resend Dashboard logs | Étape 2 |
| Intégration Twilio | SMS livré | Twilio Console logs | Étape 2 |
| Cron | Exécution manuelle, déduplication | GET `/api/cron/reminders` | Étape 3 |
| E2E Playwright | Flux Phase 2 complets | `npx playwright test tests/phase2/` | Étape 5 |
| Non-régression | Tests Phase 1 encore verts | `npx playwright test tests/phase1/` | Étape 5 |

---

*Point de retour vers Amara : uniquement après 12/12 tests Playwright Phase 2 verts + 10/10 tests Phase 1 encore verts.*
