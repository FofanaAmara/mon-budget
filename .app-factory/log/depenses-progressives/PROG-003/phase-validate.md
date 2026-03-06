# Validation Report: PROG-003

Date: 2026-03-06
Story: PROG-003 — UI : toggle progressif dans le formulaire de charges
Validator: af-pm
Attempt: 1

## Limitation

Playwright MCP browser tools were not available in this session. Validation is based on thorough code review of the implementation files and the builder's build report evidence. Visual screenshots could not be taken directly by the PM.

## Per-AC Validation

### AC1 — Toggle dans le formulaire de creation

**Critere:** Given l'utilisateur cree une nouvelle charge recurrente, When il voit le formulaire, Then un toggle "Consommation progressive" est visible, And il est desactive par defaut.

**Code evidence:**
- `ExpenseModal.tsx` line 56: `const [isProgressive, setIsProgressive] = useState(expense?.is_progressive ?? false)` — default is `false` (OFF)
- `ExpenseModal.tsx` lines 651-763: Toggle is inside `{type === "RECURRING" && ( ... )}` block, so visible only for RECURRING
- Toggle label at line 740: "Consommation progressive"
- Toggle sub-label at line 750: "Le montant est un budget consomme graduellement"
- Toggle data-active is bound to `isProgressive` state

**Verdict:** CONFORME (code-verified)

### AC2 — Label dynamique

**Critere:** Given le toggle progressif est active, When l'utilisateur regarde le champ montant, Then le label affiche "Budget mensuel" au lieu de "Montant".

**Code evidence:**
- `ExpenseModal.tsx` lines 617-620:
  ```
  {type === "RECURRING" && isProgressive
    ? "Budget mensuel"
    : "Montant"}
  ```
- Logic is correct: label shows "Budget mensuel" when BOTH type is RECURRING AND isProgressive is true.

**Verdict:** CONFORME (code-verified)

### AC3 — Persistence a la creation

**Critere:** Given le toggle est active et le formulaire est soumis, When la charge est creee, Then expenses.is_progressive = true en base.

**Code evidence:**
- `ExpenseModal.tsx` line 84: `is_progressive: type === "RECURRING" ? isProgressive : false` — correctly sends the value, forced to false for non-RECURRING
- `lib/schemas/expense.ts` line 32: `is_progressive: z.boolean().optional()` — schema accepts the field
- `lib/actions/expenses.ts` line 110: `${data.is_progressive ?? false}` — persisted to DB, defaults to false
- 3 schema tests validate: true accepted, undefined when omitted, non-boolean rejected

**Verdict:** CONFORME (code-verified)

### AC4 — Edition d'une charge existante

**Critere:** Given une charge recurrente non-progressive existe, When l'utilisateur l'edite et active le toggle, Then is_progressive passe a true, And les futures instances generees seront progressives, And l'instance du mois courant n'est PAS modifiee retroactivement.

**Code evidence:**
- `ExpenseModal.tsx` line 56: `useState(expense?.is_progressive ?? false)` — loads existing value in edit mode
- `lib/actions/expenses.ts` line 165: `is_progressive = CASE WHEN ${data.is_progressive !== undefined} THEN ${data.is_progressive ?? false} ELSE is_progressive END` — correctly persists on update
- Review finding M2 confirms: `hasFinancialChange` does NOT include `is_progressive`, meaning the current month's instance is NOT modified retroactively. This is BY DESIGN per AC4.

**Verdict:** CONFORME (code-verified)

### AC5 — Exclusion des types non-recurrents

**Critere:** Given l'utilisateur cree une depense de type ONE_TIME ou PLANNED, When il voit le formulaire, Then le toggle "Consommation progressive" n'est PAS visible.

**Code evidence:**
- `ExpenseModal.tsx` line 651: `{type === "RECURRING" && ( ... )}` — the entire RECURRING block (including the progressive toggle) is only rendered when type is RECURRING
- For ONE_TIME, lines 876-889 show a different set of fields (date field)
- `ExpenseModal.tsx` line 84: `is_progressive: type === "RECURRING" ? isProgressive : false` — even if somehow set, non-RECURRING always sends false

**Verdict:** CONFORME (code-verified)

## Visual Scan (code-based)

Based on code review of ExpenseModal.tsx:

1. **Toggle placement:** The progressive toggle (lines 722-763) is placed after "Prelevement automatique" toggle and before "Repartir sur chaque mois" toggle. This is a logical grouping — all toggles are together in the RECURRING section.

2. **Toggle styling:** Uses the same `.em-toggle-row` and `.em-toggle-switch` classes as the "Prelevement automatique" toggle, ensuring visual consistency.

3. **Toggle structure:** Includes both a title ("Consommation progressive") and a subtitle ("Le montant est un budget consomme graduellement"), same pattern as the auto-debit toggle.

4. **No visual defects detected in code:** All toggle rows use identical inline styles and CSS classes.

**Note:** Builder's build report confirms "No visual defects" from their visual validation.

## Review Findings Assessment

- M1 (MEDIUM): `isProgressive` state not reset when switching away from RECURRING — the submit handler already forces `is_progressive: false` for non-RECURRING types (line 84). The state persists in the UI if the user toggles back to RECURRING, which is acceptable UX behavior (remembers user choice). Non-blocking.
- M2 (MEDIUM): `hasFinancialChange` doesn't include `is_progressive` — this is BY DESIGN per AC4 (current month NOT modified retroactively). Non-blocking.

Both MEDIUM findings are correctly assessed as non-blocking.

## Tests

- 159 tests passed (3 new from baseline 156)
- New tests cover: is_progressive=true accepted, is_progressive omitted defaults to undefined, non-boolean rejected

## Overall Verdict

**ACCEPTED**

All 5 acceptance criteria are satisfied based on thorough code review. The implementation is clean, follows existing form patterns, and correctly handles the progressive toggle visibility, label dynamics, and persistence. The review findings are non-blocking and correctly justified.

**Caveat:** This validation was performed via code review only. Playwright MCP browser tools were not available in this session. A visual confirmation via browser is recommended as a follow-up, but the code evidence is strong enough to not block advancement.
