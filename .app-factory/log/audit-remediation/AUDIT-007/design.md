# AUDIT-007 — Design: DB Transactions for Financial Operations

**Story:** AUDIT-007 — Add DB transactions for multi-statement financial operations
**Level:** 2 (business rules — data integrity for financial operations)
**Scope:** backend, data
**Date:** 2026-03-05

---

## 1. Context & Problem

Five server actions execute multiple SQL statements without atomicity guarantees. Each `await sql` call in the Neon HTTP driver is an independent HTTP round-trip. If the process fails mid-way (network error, edge function timeout, constraint violation), partial writes corrupt financial data:

- Money debited from source but not credited to destination
- Debt balance decremented but transaction not logged
- Payment status updated but debt not adjusted

## 2. How sql.transaction() Works with Neon Serverless

### 2.1 API Shape

The `neon()` function returns a tagged-template `sql` function with a `.transaction()` method. Two calling patterns:

```typescript
// Pattern A: Array of queries
const results = await sql.transaction([
  sql`INSERT INTO ...`,
  sql`UPDATE ... SET ...`,
]);

// Pattern B: Callback (receives a txn tagged-template function)
const results = await sql.transaction(txn => [
  txn`INSERT INTO ...`,
  txn`UPDATE ... SET ...`,
]);
```

### 2.2 Critical Constraint: Non-Interactive

`sql.transaction()` is a **non-interactive** transaction. All queries are declared upfront and sent as a batch over HTTP. You **cannot** read results from query N and use them as input to query N+1 within the same transaction call.

This means:
- Functions that need to read data mid-transaction (like `markAsPaid` which reads `debt_id` and `amount` before the UPDATE) must do their reads BEFORE the transaction, then wrap only the writes in the transaction.
- This is an acceptable trade-off: reads outside the transaction may see slightly stale data, but the writes remain atomic.

### 2.3 Serverless Edge Compatibility

`sql.transaction()` uses HTTP (not WebSockets). It works in:
- Vercel Edge Functions
- Vercel Serverless Functions
- Cloudflare Workers
- Any environment where `fetch()` is available

No compatibility concern for this project (Next.js on Vercel).

### 2.4 Error Handling

If any query in the batch fails, the entire transaction is rolled back by Postgres. The `sql.transaction()` call throws an error. No partial state is persisted.

### 2.5 Return Value

`sql.transaction()` returns an array of results, one per query. Results follow the same shape as individual `sql` calls (array of row objects by default).

---

## 3. Per-Function Analysis & Design

### 3.1 transferSavings (lib/actions/expenses.ts)

**Current flow (4 queries, 4 HTTP round-trips):**
1. `INSERT INTO savings_contributions` (debit contribution)
2. `UPDATE expenses SET saved_amount = saved_amount - amount` (debit source)
3. `INSERT INTO savings_contributions` (credit contribution)
4. `UPDATE expenses SET saved_amount = saved_amount + amount` (credit destination)

**Risk:** If step 2 succeeds but step 3 fails, money is debited but never credited. Money is lost.

**Pre-transaction validation (AC5):**
- Read `saved_amount` from source expense BEFORE transaction
- Verify `saved_amount >= amount`
- Throw explicit error if insufficient funds
- This validation is a new AC requirement, not just a transaction concern

**Proposed design:**
```
1. validateInput (already exists)
2. requireAuth (already exists)
3. SELECT saved_amount FROM expenses WHERE id = fromId AND user_id = userId  [NEW - pre-validation]
4. if (saved_amount < amount) throw error  [NEW]
5. sql.transaction(txn => [
     txn`INSERT INTO savings_contributions ...` (debit),
     txn`UPDATE expenses SET saved_amount = saved_amount - amount ...` (debit),
     txn`INSERT INTO savings_contributions ...` (credit),
     txn`UPDATE expenses SET saved_amount = saved_amount + amount ...` (credit),
   ])
6. revalidatePath (unchanged)
```

**Notes:**
- All 4 writes are independent (no cross-query data dependency) -- perfect fit for non-interactive transaction
- Pre-validation read is outside transaction (acceptable: worst case, concurrent modification makes the UPDATE set saved_amount negative, but GREATEST(saved_amount - amount, 0) could be added as defense-in-depth if desired)

### 3.2 addSavingsContribution (lib/actions/expenses.ts)

**Current flow (2 queries):**
1. `INSERT INTO savings_contributions`
2. `UPDATE expenses SET saved_amount = saved_amount + amount`

**Risk:** Contribution logged but total not updated, or vice versa.

**Pre-transaction validation:** None needed (amount already validated by Zod schema).

**Proposed design:**
```
1. validateInput (already exists)
2. requireAuth (already exists)
3. sql.transaction(txn => [
     txn`INSERT INTO savings_contributions ...`,
     txn`UPDATE expenses SET saved_amount = saved_amount + amount ...`,
   ])
4. revalidatePath (unchanged)
```

**Notes:** Straightforward -- no data dependency between the two queries.

### 3.3 markAsPaid (lib/actions/monthly-expenses.ts)

**Current flow (4-5 queries):**
1. `UPDATE monthly_expenses SET status = 'PAID'`
2. `SELECT debt_id, amount, month FROM monthly_expenses WHERE id = ...` (conditional read)
3. If debt: `UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0)`
4. If debt: `UPDATE debts SET is_active = false WHERE remaining_balance <= 0`
5. If debt: `INSERT INTO debt_transactions`

**Risk:** Status updated to PAID but debt balance not decremented, or debt deactivated but transaction not logged.

**Pre-transaction validation:** None specific. The SELECT in step 2 reads data needed for conditional writes.

**Proposed design:**
```
1. validateInput (already exists)
2. requireAuth (already exists)
3. SELECT debt_id, amount, month FROM monthly_expenses WHERE id AND user_id  [READ FIRST]
4. IF no debt link:
     await sql`UPDATE monthly_expenses SET status = 'PAID', paid_at = ...`  [single query, no tx needed]
5. IF debt link:
     sql.transaction(txn => [
       txn`UPDATE monthly_expenses SET status = 'PAID', paid_at = ...`,
       txn`UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0) ...`,
       txn`UPDATE debts SET is_active = false WHERE remaining_balance <= 0 ...`,
       txn`INSERT INTO debt_transactions ...`,
     ])
6. revalidatePath (unchanged)
```

**Key decision:** The SELECT (step 3) moves BEFORE the transaction. This is acceptable because:
- We read `debt_id`, `amount`, `month` -- these are immutable once the monthly_expense exists
- The transaction wraps all the writes atomically
- Steps 3 and 4 in the current code (UPDATE debts twice) can remain as two separate queries because the second one has a WHERE clause that depends on the result of the first (remaining_balance <= 0 after decrement). In the non-interactive model, the second UPDATE uses the state AFTER the first UPDATE within the same transaction (Postgres executes them sequentially within the tx).

**Note on merging the two UPDATE debts:** Steps 3 and 4 could theoretically be merged into a single UPDATE with a CASE expression, but keeping them separate is clearer and Postgres handles the sequential execution within the transaction correctly.

### 3.4 makeExtraPayment (lib/actions/debts.ts)

**Current flow (3 queries):**
1. `UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0)`
2. `UPDATE debts SET is_active = false WHERE remaining_balance <= 0`
3. `INSERT INTO debt_transactions`

**Risk:** Balance decremented but payment not logged, or debt deactivated without transaction record.

**Pre-transaction validation:** None needed (Zod validates amount).

**Proposed design:**
```
1. validateInput (already exists)
2. requireAuth (already exists)
3. sql.transaction(txn => [
     txn`UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0) ...`,
     txn`UPDATE debts SET is_active = false WHERE remaining_balance <= 0 ...`,
     txn`INSERT INTO debt_transactions ...`,
   ])
4. revalidatePath (unchanged)
```

**Notes:** All 3 writes have no inter-query data dependency (the second UPDATE uses a WHERE condition on the post-first-UPDATE state, which Postgres resolves sequentially within the tx). Clean fit.

### 3.5 addDebtTransaction (lib/actions/debt-transactions.ts)

**Current flow (2-3 queries):**
1. `INSERT INTO debt_transactions`
2. If PAYMENT: `UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0)`
3. If PAYMENT: `UPDATE debts SET is_active = false WHERE remaining_balance <= 0`
4. If CHARGE: `UPDATE debts SET remaining_balance = remaining_balance + amount`

**Risk:** Transaction logged but balance not updated, or vice versa.

**Pre-transaction validation:** None needed.

**Proposed design:**
```
1. validateInput (already exists)
2. requireAuth (already exists)
3. IF type === 'PAYMENT':
     sql.transaction(txn => [
       txn`INSERT INTO debt_transactions ...`,
       txn`UPDATE debts SET remaining_balance = GREATEST(remaining_balance - amount, 0) ...`,
       txn`UPDATE debts SET is_active = false WHERE remaining_balance <= 0 ...`,
     ])
4. ELSE (CHARGE):
     sql.transaction(txn => [
       txn`INSERT INTO debt_transactions ...`,
       txn`UPDATE debts SET remaining_balance = remaining_balance + amount ...`,
     ])
5. revalidatePath (unchanged)
```

**Notes:** The conditional logic (PAYMENT vs CHARGE) determines which queries go into the transaction. The branching happens BEFORE the transaction call -- this is fine because the type is known from the input.

---

## 4. Error Handling Pattern

### 4.1 On Rollback

When `sql.transaction()` throws:
- Postgres rolls back all writes automatically
- The error propagates up the call stack
- The server action returns an error to the client
- `revalidatePath()` is NOT called (no stale cache invalidation)

### 4.2 Pre-Transaction Validation Errors

For `transferSavings` (AC5), a new explicit validation error is thrown BEFORE the transaction:
```typescript
if (Number(sourceExpense.saved_amount) < amount) {
  throw new Error("Fonds insuffisants dans le projet source");
}
```

This is a business rule violation, not a DB error. It must be thrown before any write attempt.

### 4.3 No Changes to Error Handling in Callers

Server actions already propagate errors to the client. The transaction wrapping is transparent to callers -- same function signatures, same error behavior, but now with atomicity.

---

## 5. Implementation Plan

### Order of changes:

1. **lib/db.ts** -- No changes needed. `sql` already has `.transaction()` available.

2. **lib/actions/expenses.ts** -- Wrap `transferSavings` and `addSavingsContribution`:
   - `transferSavings`: Add pre-validation SELECT + sql.transaction()
   - `addSavingsContribution`: sql.transaction()

3. **lib/actions/monthly-expenses.ts** -- Wrap `markAsPaid`:
   - Move SELECT before transaction
   - Conditional: single query (no debt) vs transaction (with debt)

4. **lib/actions/debts.ts** -- Wrap `makeExtraPayment`:
   - sql.transaction()

5. **lib/actions/debt-transactions.ts** -- Wrap `addDebtTransaction`:
   - Conditional transaction based on type

### Files modified:
| File | Change |
|------|--------|
| `lib/actions/expenses.ts` | Wrap 2 functions in sql.transaction() |
| `lib/actions/monthly-expenses.ts` | Restructure markAsPaid, wrap writes in sql.transaction() |
| `lib/actions/debts.ts` | Wrap makeExtraPayment in sql.transaction() |
| `lib/actions/debt-transactions.ts` | Wrap addDebtTransaction in sql.transaction() |

### Files NOT modified:
- `lib/db.ts` -- No changes needed (sql.transaction() is already available)
- No new files created
- No migration needed (no DB schema changes)

---

## 6. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Non-interactive limitation** -- cannot read query N result for query N+1 | LOW | All identified functions either have no inter-query data deps, or the read can be moved before the transaction. Verified for all 5 functions. |
| **Race condition on pre-validation read** -- saved_amount changes between SELECT and transaction | LOW | Single-user app (alpha stage). For future: could add CHECK constraint on expenses table or use SELECT FOR UPDATE (requires WebSocket connection, not available in HTTP mode). Acceptable risk for now. |
| **HTTP transaction size limit** -- too many queries in one batch | NEGLIGIBLE | Max 5 queries per transaction. Well within any reasonable limit. |
| **Edge runtime compatibility** | NONE | sql.transaction() uses HTTP, same as regular sql calls. Already runs on Vercel. |
| **Behavioral regression** | LOW | Functions produce identical results when all queries succeed. The only new behavior is atomicity on failure. Existing tests validate the success path. |
| **revalidatePath after failed transaction** | NONE | revalidatePath calls are AFTER the transaction. If the transaction throws, they are never reached. No change needed. |

---

## 7. Migration Safety Assessment

**No DB migration required.** This story modifies only application-level code (server actions). No schema changes, no new tables, no column alterations.

Gate migration check: N/A.

---

## 8. ADR

### ADR: Use Neon HTTP non-interactive transactions for financial atomicity

**Context:** Financial operations execute 2-5 SQL statements that must be atomic. The Neon serverless driver offers `sql.transaction()` which batches queries over HTTP in a non-interactive transaction.

**Decision:** Use `sql.transaction()` with callback pattern (`txn => [...]`) for all multi-write financial operations. Accept the non-interactive constraint (no mid-transaction reads) by restructuring functions to read first, then write atomically.

**Alternatives considered:**
- **WebSocket connection (Pool/Client):** Supports interactive transactions but requires persistent connections, incompatible with serverless edge, and adds complexity. Rejected.
- **Application-level compensation (saga pattern):** Overkill for single-database operations. Rejected.
- **Do nothing:** Unacceptable -- financial data corruption risk is HIGH severity.

**Consequences:**
- All financial multi-write operations become atomic
- Functions with mid-flow reads (markAsPaid) are restructured: read-then-write
- No infrastructure changes needed
- Future: if interactive transactions are ever needed, would require switching to WebSocket mode for those specific operations
