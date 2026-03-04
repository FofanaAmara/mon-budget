# Audit — PWA

> Feature: pwa / pwa-install
> Source: public/manifest.json, public/sw.js, app/layout.tsx
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Manifest correct | YES | YES | YES | YES | OK |
| AC-2 Service Worker | YES | YES | YES | YES | OK |
| AC-3 Installabilite | YES | YES | YES | YES | OK |
| AC-4 Favicon et icones | YES | PARTIAL | YES | NO | ISSUE |

## Issues

### ISSUE-PWA-01 — Cache favicon (MINEUR)
**AC-4** : Le favicon SVG est correct (compass teal) mais le navigateur/SW cache l'ancien. Le plan recommande de bumper CACHE_NAME de 'mes-finances-v1' a 'mes-finances-v2' et de changer theme_color de #3D3BF3 a #0F766E.

**Severite** : MINEUR — Probleme de cache, pas de fonctionnalite.

## Verdict Global: COMPLETE

- 0 BLOQUANT
- 1 MINEUR (cache favicon)
