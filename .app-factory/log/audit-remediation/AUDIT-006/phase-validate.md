# PM Validation — AUDIT-006: Fix critical accessibility

**Date:** 2026-03-05
**Story:** AUDIT-006 — Fix critical accessibility (htmlFor, userScalable, keyboard, ARIA)
**Level:** 1 | **Scope:** frontend
**Review verdict:** APPROVED WITH NOTES (0 CRITICAL, 1 MEDIUM)
**Build evidence:** 148 tests pass, build OK

---

## Per-AC Validation

### AC1 — Labels have htmlFor matching input ids
**Verdict: CONFORME**

Evidence:
- 59 `htmlFor` occurrences across 15 component files
- Spot-checked ExpenseModal, DebtModal, IncomeModal: every `htmlFor` value matches the `id` on the corresponding `<input>`, `<select>`, or `<textarea>` (e.g., `htmlFor="expense-section"` matches `id="expense-section"`)
- Labels without `htmlFor` (13 instances) are all labels for button groups, chip selectors, emoji pickers, or color pickers -- not for `<input>`/`<select>`/`<textarea>` elements. The AC specifically requires htmlFor on labels associated with form inputs, which is satisfied.
- No `<label>` associated with a form input is missing `htmlFor`.

### AC2 — Viewport allows zoom (userScalable removed, maximumScale >= 5)
**Verdict: CONFORME**

Evidence:
- `app/layout.tsx` line 34: `maximumScale: 5`
- `userScalable` is completely absent from the file (grep confirms no match)
- Users can now zoom up to 5x, meeting WCAG 1.4.4 requirements

### AC3 — Backdrops have role="presentation"
**Verdict: NON IMPLEMENTE (partiel)**

Evidence:
- 20 `role="presentation"` occurrences across 16 component files -- good coverage on modals that were modified
- **GAP:** `DepensesTrackingClient.tsx` line 510 -- backdrop div with `onClick` handler but NO `role="presentation"`. This component was explicitly listed in the story's Technical Notes as requiring backdrop fixes ("Backdrops : ~15 instances dans DepensesTrackingClient, ...")

### AC4 — ARIA on modals (role="dialog", aria-modal, aria-labelledby)
**Verdict: NON IMPLEMENTE (partiel)**

Evidence:
- 20 `role="dialog"`, 20 `aria-modal`, 20 `aria-labelledby` occurrences across 16 files -- good coverage on modified modals
- **GAP:** `DepensesTrackingClient.tsx` -- `SheetWrapper` component (line 773) renders sheets without `role="dialog"`, `aria-modal="true"`, or `aria-labelledby`. This wrapper is used for 4 sheets (actionSheet, deferSheet, editAmountSheet, deleteSheet). Explicitly in scope per Technical Notes.

### AC5 — Escape closes modals
**Verdict: NON IMPLEMENTE (partiel)**

Evidence:
- 20 Escape key handlers across 16 files -- good coverage on modified modals
- **GAP:** `DepensesTrackingClient.tsx` -- zero Escape handlers. None of the 4 SheetWrapper-based sheets respond to Escape key. Explicitly in scope per Technical Notes.

### AC6 — Build passes, forms work identically
**Verdict: CONFORME**

Evidence:
- 148 tests pass
- Build OK
- No functional changes to form logic -- only accessibility attributes added

---

## Gap Summary

| Component | Missing | ACs impacted |
|-----------|---------|--------------|
| `DepensesTrackingClient.tsx` backdrop (line 510) | `role="presentation"` | AC3 |
| `DepensesTrackingClient.tsx` SheetWrapper (line 773) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | AC4 |
| `DepensesTrackingClient.tsx` sheets (4 instances) | Escape key handler, `onKeyDown`, `tabIndex={-1}` | AC5 |

All gaps are in the same file (`DepensesTrackingClient.tsx`) which was explicitly listed in the story's Technical Notes but was not modified during the build.

---

## Overall Verdict

**NEEDS REWORK**

3 of 6 ACs are partially unmet. The `DepensesTrackingClient.tsx` component -- explicitly listed in the story's Technical Notes as requiring fixes -- was entirely skipped. Its backdrop, 4 sheets, and keyboard handling remain inaccessible.

**Required fixes:**
1. Add `role="presentation"` to the backdrop div at line 510
2. Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to the SheetWrapper div (line 810)
3. Add `onKeyDown` Escape handler + `tabIndex={-1}` to the SheetWrapper container
4. Add `id` attributes to sheet titles for `aria-labelledby` references

**Note on review finding (MEDIUM):** The reviewer noted missing auto-focus on 2 of 17 modals. Auto-focus is mentioned in the Technical Notes ("auto-focus a l'ouverture") but is NOT an explicit AC. This is not grounds for rejection, but the Builder should address it while fixing the above gaps.

---

# PM Validation — AUDIT-006 (2nd attempt, post-rework)

**Date:** 2026-03-05
**Rework commit:** 4a4c088
**Rework scope:** DepensesTrackingClient.tsx (4 sheets: backdrop role, dialog ARIA, Escape, auto-focus) + auto-focus added to SectionsClient and ParametresClient
**Build evidence:** 148 tests pass, build OK

---

## Per-AC Validation (2nd attempt)

### AC1 — Labels have htmlFor matching input ids
**Verdict: CONFORME** (no regression)

Rework did not touch label/htmlFor attributes. Previous validation confirmed 59 htmlFor occurrences across 15 files, all matching their inputs.

### AC2 — Viewport allows zoom (userScalable removed, maximumScale >= 5)
**Verdict: CONFORME** (no regression)

- `app/layout.tsx` line 34: `maximumScale: 5`
- `userScalable` remains absent from the file

### AC3 — Backdrops have role="presentation"
**Verdict: CONFORME**

Evidence:
- `DepensesTrackingClient.tsx` line 987: backdrop div now has `role="presentation"`
- Previous gap (line 510 in 1st attempt) is resolved — the backdrop correctly marks itself as presentational

### AC4 — ARIA on modals (role="dialog", aria-modal, aria-labelledby)
**Verdict: CONFORME**

Evidence:
- `SheetWrapper` component (line 1796): `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`
- All 4 SheetWrapper instances pass a unique `titleId`:
  - `actionSheet` -> `titleId="action-sheet-title"` (id at line 1064)
  - `deferSheet` -> `titleId="defer-sheet-title"` (id at line 1286)
  - `editAmountSheet` -> `titleId="edit-amount-sheet-title"` (id at line 1489)
  - `deleteSheet` -> `titleId="delete-sheet-title"` (id at line 1681)
- Each `aria-labelledby` value has a matching `id` attribute on the sheet title element

### AC5 — Escape closes modals
**Verdict: CONFORME**

Evidence:
- `SheetWrapper` component (line 1800-1801): `onKeyDown` handler checks `e.key === "Escape"` and calls `onClose()`
- `tabIndex={-1}` is set on the dialog div (line 1799) to make it focusable
- Auto-focus via `useEffect` + `dialogRef.current?.focus()` (lines 1751-1755) ensures the sheet receives keyboard events immediately on open
- All 4 sheets inherit this behavior through SheetWrapper

### AC6 — Build passes, forms work identically
**Verdict: CONFORME**

Evidence:
- 148 tests pass, build OK (per rework report)
- Changes are strictly accessibility attributes — no functional logic modified

---

## Bonus: Review finding addressed

The reviewer's MEDIUM finding about missing auto-focus on 2 of 17 modals has been addressed:
- `DepensesTrackingClient.tsx` SheetWrapper: `dialogRef.current?.focus()` (line 1754)
- `SectionsClient.tsx`: `dialogRef.current?.focus()` (line 97)
- `ParametresClient.tsx`: `dialogRef.current?.focus()` (line 208)

---

## Overall Verdict

**ACCEPTED**

All 6 acceptance criteria are met. The 3 gaps identified in the 1st validation (all in `DepensesTrackingClient.tsx`) have been properly fixed:
1. Backdrop now has `role="presentation"` -- AC3 resolved
2. SheetWrapper now has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` with matching title ids on all 4 sheets -- AC4 resolved
3. SheetWrapper now handles Escape key, has `tabIndex={-1}`, and auto-focuses on open -- AC5 resolved

The reviewer's MEDIUM finding (auto-focus) was also addressed as a bonus. No regressions detected on AC1, AC2, or AC6.
