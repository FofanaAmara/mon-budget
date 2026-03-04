# Audit — Push notifications

> Feature: notifications / push-notifications
> Source: NotificationPermission.tsx, api/push/subscribe/route.ts, api/push/send/route.ts, sw.js
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Demande permission | YES | YES | YES | YES | OK |
| AC-2 Stockage abonnement | YES | YES | YES | YES | OK |
| AC-3 Envoi rappels | YES | PARTIAL | YES | PARTIAL | ISSUE |
| AC-4 Log notifications | YES | YES | YES | YES | OK |

## Issues

### ISSUE-PUSH-01 — Pas de cron/scheduler pour l'envoi (MINEUR)
**AC-3** : L'endpoint /api/push/send existe et fonctionne, mais il n'y a pas de cron job ou scheduler configure pour l'appeler automatiquement. L'envoi depend d'un appel externe.

**Severite** : MINEUR — La fonctionnalite est implementee mais non automatisee.

## Verdict Global: INCOMPLETE

- 0 BLOQUANT
- 1 MINEUR (pas de cron)
