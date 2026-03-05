# DISC-002 — Alignement des montants sur la page charges fixes

**Type:** BUG_UI
**Severity:** MINEUR
**Discovered during:** FIX-BLQ-001 validation
**Blocking:** Non

## Description
Sur `/parametres/charges`, les montants des charges ne sont pas bien alignés à droite. Le symbole `$` en petit superscript crée un décalage visuel entre les lignes.

## Screenshot
`.tmp/charges-page-alignment.png`

## Fixes Applied

### Fix 1 — Row amounts (commit `cef89af`)
- Changed amount container from `minWidth: '100px'` to `width: '120px', flexShrink: 0`
- Root cause: without fixed width, `textAlign: right` has no effect — each container is only as wide as its content
- With fixed width, all amount containers are 120px wide, right-aligned text aligns perfectly

### Fix 2 — Section header vs row alignment (staircase effect)
- Root cause: section header amounts had no right margin, while row amounts had 74px of action buttons (edit 32px + delete 32px + gaps) to their right → header amounts appeared 74px further right than row amounts
- Fix: added `marginRight: "74px"` to section header amount span in `SectionCard`
- This compensates for the action buttons' occupied space, aligning header and row amounts on the same vertical axis

### Fix 3 — Annual charge secondary line format
- Root cause: Tax Scolaire showed `3 642,00$/annuel` — dollar sign after number (fr-CA convention) inconsistent with app-wide `$` prefix convention, and full decimals made secondary line wider than primary
- Fix: changed to `$3 642 /an` — `$` prefix matching app convention, no decimals (supplementary info), shortened label, added `whiteSpace: nowrap`

## Verification
- Screenshots: `.tmp/disc002-both-fixes.png` (desktop), `.tmp/disc002-mobile.png` (mobile)
- Desktop: all section header amounts align vertically with child row amounts across all 4 sections
- Mobile (390px): alignment preserved, Tax Scolaire secondary line renders compactly
- No staircase effect visible on either viewport

## Status
DONE — verified visually on desktop and mobile viewports
