# Validation Report: PROG-001

Date: 2026-03-06
Story: PROG-001 — Migration DB : support des depenses progressives
Level: 1 (fast track)
Validator: af-pm

## Per-AC Verdicts

### AC1 — Colonne is_progressive sur expenses: PASS

- Migration script: `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_progressive BOOLEAN DEFAULT FALSE`
- Type et default conformes a la story (BOOLEAN, DEFAULT FALSE)
- Build report confirme: 54 lignes existantes ont is_progressive=false (0 ecart)
- data-model.md mis a jour (ligne 73)

### AC2 — Colonne paid_amount sur monthly_expenses: PASS

- Migration script: `ALTER TABLE monthly_expenses ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0`
- Type et default conformes a la story (DECIMAL(10,2), DEFAULT 0)
- Build report confirme: 83 lignes existantes ont paid_amount=0 (0 ecart)
- data-model.md mis a jour (ligne 97)

### AC3 — Table expense_transactions creee: PASS

- Colonnes conformes a la story:
  - id: UUID PK (gen_random_uuid())
  - user_id: TEXT NOT NULL
  - monthly_expense_id: UUID NOT NULL, FK monthly_expenses ON DELETE CASCADE
  - amount: DECIMAL(10,2) NOT NULL
  - note: TEXT
  - created_at: TIMESTAMPTZ DEFAULT NOW()
- Index idx_expense_tx_monthly(monthly_expense_id, created_at DESC) present
- FK constraint creee via REFERENCES dans le CREATE TABLE
- data-model.md mis a jour (lignes 236-248)

### AC4 — Schema de reference mis a jour: PASS

- is_progressive documente sur expenses
- paid_amount documente sur monthly_expenses
- Table expense_transactions entierement documentee (colonnes, types, contraintes, index)
- Migration ajoutee dans l'historique des migrations (ligne 320)

## Visual Scan

N/A — story purement DB, aucune modification UI.

## Regression Check

Build report: 148 tests passes, aucun changement par rapport a la baseline.

## Review Notes (non-bloquants)

La review a emis 2 MEDIUM et 2 LOW, aucun ne constitue un ecart par rapport aux AC:
- M1: CHECK amount > 0 manquant sur expense_transactions — amelioration valide, hors scope AC
- M2: schema-current.sql non mis a jour — derive pre-existante, hors scope story
- L1: CHECK paid_amount >= 0 manquant — amelioration valide, hors scope AC
- L2: Index sur user_id manquant — nice to have, hors scope AC

Ces items sont des ameliorations futures, pas des ecarts par rapport aux criteres d'acceptation.

## Verdict

**ACCEPTED**

4/4 criteres conformes. Migration idempotente, defaults corrects, documentation a jour, tests verts. Aucun ecart identifie.
