# PROG-004 — Validation PM

**Date:** 2026-03-06
**Agent:** af-pm (validate mode)
**Story:** PROG-004 — UI : suivi progressif dans la page depenses
**Environment:** localhost:3000 (dev server)
**Evidence:** Build screenshots (.tmp/prog-004-*.png), code inspection, review report

---

## Per-AC Verdict

### AC1 — Barre de progression: PASS

**Expected:** Depense progressive affiche "X $ / Y $" avec barre de progression au pourcentage correct, couleur standard (pas rouge).

**Verified:**
- Screenshot `prog-004-en-cours-group.png` shows "475,50 $ / 1 000,00 $" with a teal progress bar at ~47.5%
- Code confirms: `progressPct = Math.min((paidAmount / budgetAmount) * 100, 100)` (line 103-105 ExpenseTrackingRow.tsx)
- Bar color is `var(--teal-700)` when not over-budget (line 244)
- Number() casts applied for DECIMAL-as-string safety (lines 98-99)

### AC2 — Action "Ajouter un achat": PASS

**Expected:** Progressive expense shows "Ajouter un achat" and "Historique des achats", NOT "Marquer payee" or "Remettre a venir".

**Verified:**
- Code: `expense.is_progressive ? (<> Ajouter un achat / Historique des achats </>) : (<> Marquer payee / Remettre a venir </>)` (ExpenseActionSheet.tsx lines 760-850)
- Build log confirms functional test: added 125.50 "Maxi semaine 3" via "Ajouter un achat"
- Toggle button (checkmark circle) hidden for progressives: `{isCurrentMonth && !isProgressive && (...)` (ExpenseTrackingRow.tsx line 279)

### AC3 — Sheet ajout de transaction: PASS

**Expected:** Sheet with montant (obligatoire), note (optionnel), bouton "Ajouter". Soumission incremente paid_amount et rafraichit la liste.

**Verified:**
- Sheet rendered at ExpenseActionSheet.tsx lines 151-261
- Montant field: `type="number" min="0.01" step="0.01"` with autoFocus (line 183-188)
- Note field: `type="text"` with placeholder "Ex: Achat Amazon" (lines 219-245)
- Button "Ajouter" disabled when amount invalid: `disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}` (line 254)
- Server action `addExpenseTransaction` uses SQL transaction to atomically INSERT + UPDATE paid_amount (expense-transactions.ts lines 38-48)
- Zod validation with `positiveAmountSchema` ensures amount > 0
- `revalidateExpensePages()` called after mutation for list refresh (line 50)
- Defense in depth: server verifies `e.is_progressive = true` before accepting (lines 28-36)

### AC4 — Depassement visuel: PASS

**Expected:** Quand paid_amount >= amount, montant et barre en rouge, barre a 100%.

**Verified:**
- Screenshot `prog-004-over-budget.png` shows "1 075,50 $ / 1 000,00 $" in RED text for Epicerie
- Code: `isOverBudget = isProgressive && paidAmount >= budgetAmount && budgetAmount > 0` (line 100-101)
- Color: `color: isOverBudget ? "var(--error)" : "var(--slate-900)"` (line 224)
- Bar: `background: isOverBudget ? "var(--error)" : "var(--teal-700)"` (line 244)
- Bar capped at 100%: `Math.min(..., 100)` (line 104)

### AC5 — Historique des sous-transactions: PASS

**Expected:** Liste avec date, montant, note pour chaque transaction, en ordre chronologique inverse.

**Verified:**
- History view rendered at ExpenseActionSheet.tsx lines 264-380
- `getExpenseTransactions` returns `ORDER BY created_at DESC` (expense-transactions.ts line 66)
- Each transaction displays: date (Intl.DateTimeFormat fr-CA), amount (formatCAD), note (lines 316-370)
- Empty state: "Aucun achat enregistre" (line 312) — accent correctly applied
- Build log confirms: "3 transactions shown, ordered by date desc, with notes"

### AC6 — Monument correct: PASS

**Expected:** Progressive expenses contribute paid_amount to "paye" total and budget (amount) to "prevu" total.

**Verified:**
- SQL query in getMonthSummary: `CASE WHEN e.is_progressive = true THEN me.paid_amount WHEN me.status = 'PAID' THEN me.amount ELSE 0 END` as paid_total (monthly-expenses.ts lines 295-299)
- Screenshot confirms: monument shows $2,097 / $3,554 after progressive transactions (en-cours-group screenshot)
- After over-budget: monument shows $2,697 / $3,554 (over-budget screenshot)
- Total "prevu" ($3,554) includes progressive budget ($1,000) — correct

### AC7 — Groupement par statut adapte: PASS

**Expected:** Progressive with paid_amount > 0 but < amount in "En cours". Progressive with paid_amount=0 in "A venir".

**Verified:**
- `getDisplayGroup()` in lib/expense-display-utils.ts (lines 187-197):
  - OVERDUE/DEFERRED always take priority (M1 design review finding)
  - `paidAmount > 0 && paidAmount < budgetAmount` => "IN_PROGRESS"
  - `paidAmount >= budgetAmount` => "PAID"
  - Default (paid_amount=0) => "UPCOMING"
- Screenshot `prog-004-en-cours-group.png`: Epicerie appears in "EN COURS (1)" group with badge "EN COURS"
- Screenshot `prog-004-over-budget.png`: After exceeding budget, Epicerie moves to "PAYE (8)" group
- GROUP_ORDER and GROUP_LABELS correctly extended with IN_PROGRESS (constants.ts)
- 21 unit tests cover all grouping scenarios including edge cases (OVERDUE/DEFERRED priority)

---

## Visual Scan

**Overall page layout:** Clean, no visual defects detected.

**Screenshot analysis (as a user):**

1. **prog-004-depenses-page.png** — Standard view. "A VENIR (9)" section well-organized. All amounts right-aligned, consistent formatting. Monument $2,022 / $2,954 with progress bar. No overlap, no truncation, no broken layout.

2. **prog-004-en-cours-group.png** — "EN COURS (1)" section appears ABOVE "A VENIR (9)" — correct ordering (in-progress before upcoming). Epicerie shows "475,50 $ / 1 000,00 $" with teal bar. The progress bar is compact (4px height) and proportional. Badge "EN COURS" in teal matches the design system. No toggle button on the right — correct. The bar chart icon differentiates from the clock icon used for upcoming expenses.

3. **prog-004-over-budget.png** — Full page view. Epicerie now in "PAYE (8)" section. Amount "1 075,50 $ / 1 000,00 $" is clearly RED. Red progress bar visible underneath. No toggle button — correct. Other PAID expenses show the green checkmark toggle. Visual distinction between progressive (no toggle, "X/Y" format) and regular (toggle, "-X $" format) is clear and coherent.

4. **prog-004-paye-section.png** — Baseline view showing initial PAYE section. Epicerie shows "-400,00 $" as a regular PAID expense (before progressive tracking was activated). This appears to be a before/after comparison point.

**Visual defects found:** None.

**Layout coherence:** The progressive expense row stands out visually from regular expenses through (1) the "X $ / Y $" format instead of "-X $", (2) the progress bar, (3) the absence of toggle button, and (4) the bar chart icon. This differentiation is clear and consistent.

---

## Review Findings Follow-up

| Finding | Status | Verified |
|---------|--------|----------|
| HIGH-1 (uncommitted Number() casts) | FIXED | Number() casts present in getDisplayGroup (line 192-193) and ExpenseTrackingRow (lines 98-99) |
| MEDIUM-1 (duplicated getDisplayGroup) | FIXED | Function extracted to lib/expense-display-utils.ts, imported in component and tests |
| MEDIUM-2 (no progressive check in server action) | FIXED | Guard query added: lines 28-36 in expense-transactions.ts |
| MEDIUM-3 (ExpenseActionSheet too large) | NOTED | Not a blocking issue per review. Discovery recommended |
| LOW-1 (missing accent "enregistre") | FIXED | Line 312 shows "enregistre" with accent |
| LOW-2 (useRef focus pattern) | N/A | No action required per review |

---

## Regressions Check

- Non-progressive expenses: screenshots show regular expenses (Spotify, iCloud+, Loyer, etc.) with normal behavior — toggle buttons present, "-X $" format, correct badges (PREVU, PAYE)
- Monument: correctly sums all expense types
- autoMarkPaidForAutoDebit: code confirms NOT EXISTS exclusion for progressive expenses (monthly-expenses.ts lines 507-510)
- 180 tests pass (159 baseline + 21 new) — no regression in existing tests
- Build: clean, no TypeScript errors

---

## Verdict: ACCEPTED

All 7 acceptance criteria pass. No visual defects detected. No regressions. Review findings have been addressed (HIGH-1, MEDIUM-1, MEDIUM-2, LOW-1 all fixed). The implementation correctly differentiates progressive from non-progressive expenses across all UI and data layers.

**Note:** MEDIUM-3 (ExpenseActionSheet file size at 1215 lines) was acknowledged by the reviewer as pre-existing and not blocking. It should be tracked as a discovery for future refactoring.
