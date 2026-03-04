# Audit — Gestion des sections

> Feature: configuration / gestion-sections
> Source: SectionsClient.tsx, sections.ts, claim.ts
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 CRUD fonctionnel | YES | YES | YES | YES | OK |
| AC-2 Proprietes | YES | YES | YES | YES | OK |
| AC-3 Sections par defaut | YES | YES | YES | YES | OK |

## Issues

### ISSUE-SEC-01 — Pas de cascade protection a la suppression (MINEUR)
**AC-1** : La suppression d'une section ne verifie pas si elle est utilisee par des charges, allocations ou depenses mensuelles. Si une section est supprimee, les references deviennent des FK orphelines (section_id pointe vers une section inexistante), ce qui peut provoquer des erreurs d'affichage (LEFT JOIN retourne null).

**Severite** : MINEUR — Les LEFT JOIN evitent les crashes, mais l'UX est degradee (sections manquantes affichees comme "—").

## Verdict Global: COMPLETE

- 0 BLOQUANT
- 1 MINEUR (cascade protection)
