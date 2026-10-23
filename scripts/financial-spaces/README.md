# Financial spaces — isolated migration preparation

This tooling never applies a migration to `POSTGRES_URL`. It backs up the
`public` schema with the host's native PostgreSQL client, then restores it only
into a project-owned Docker container on `127.0.0.1:55437`.

Private archives, row fingerprints and diagnostics stay in the ignored
`.local/financial-spaces/` directory. Never commit or upload that directory.

## Prerequisites

- Docker available; official `postgres:17-alpine` image.
- Native PostgreSQL **17.11** client at
  `.local/tools/libpq@17/17.11/bin/pg_dump`. This matches the source version.
  On this Mac, the official Homebrew bottle was downloaded with
  `HOMEBREW_NO_AUTO_UPDATE=1 brew fetch --force-bottle libpq@17`, its SHA256
  verified against the official bottle manifest, and extracted in `.local/tools/`.
  Only those local binaries were relocated and signed; no global Homebrew links
  were changed. Their SSL/Kerberos dependencies use the installed system paths.
  Provenance is recorded privately in `.local/tools/libpq17-source.json`.
- Existing server-only `.env.local`, with `POSTGRES_URL_NON_POOLING` or
  `POSTGRES_URL`. Values are never passed to Docker or printed.

## Commands

```sh
node scripts/financial-spaces/test-database.mjs prepare
node scripts/financial-spaces/test-database.mjs snapshot
node scripts/financial-spaces/test-database.mjs verify
# Resume a completed backup interrupted during restoration:
node scripts/financial-spaces/test-database.mjs restore
# Static source inventory; no environment/DB access:
node scripts/financial-spaces/inventory.mjs
```

`snapshot` preserves any existing archive and refuses to replace it. `restore`
never overwrites a populated database. It checks ownership, localhost binding,
mount path and PostgreSQL system identifier before connecting for any write.
It uses a transaction for each restore and records the exact archive hash and
restored fingerprint. A missing marker after commit can be recovered only by
matching another certified restoration of that same archive.

The schema-limited archive does not include extension definitions. Restoration
reproduces the source's `uuid-ossp` 1.1 extension, then excludes only the already
created `public` schema entry from the archive TOC. Unexpected extensions stop
the operation. This follows [PostgreSQL's schema-limited dump semantics](https://www.postgresql.org/docs/17/app-pgdump.html).

Verification requires the archive, manifest, SHA256, complete source schema
inventory and completed restore markers. PostgreSQL normalizes some CHECK casts
when recreating them: expected CHECK definitions are reparsed on empty TEMP
tables before the complete canonical definitions are compared. Public records
are only read by verification. Every row is hashed in canonical sorted order;
no row contents are printed. Two empty databases cannot pass verification.

The current pair is `spaces_baseline17` / `spaces_work17`. Verification compares
their **pre-migration** state; after implementation tests mutate the work copy,
the verifier is expected to refuse equivalence. Preserve the baseline/archive
and use separate migration conservation checks rather than resetting work data.

Earlier failed attempts and the PostgreSQL 18 archive remain private for
diagnosis. No cleanup of unrelated containers, databases or Homebrew installs
is performed by these commands.

## Space migrations (local fixture only)

```sh
node scripts/financial-spaces/migrate.mjs --dry-run
node scripts/financial-spaces/migrate.mjs --apply --through=002
node scripts/financial-spaces/verify-conservation.mjs
npm run test:spaces:db
```

`001` expands without enabling the new app; `002` backfills/repeats under table
locks while legacy writers are still the only source of truth. Changes to
settings and guide state are refreshed on every pass, including nulls/absence.
Every historical column is fingerprinted before and after each transaction.
An ambiguous owner, cross-owner relationship or duplicate free savings stops
the migration instead of claiming or merging records.

The runner accepts only clients verified by `localConnection`, and only the
named work fixture or a freshly named integration-test database. It has no
production URL override. A dry-run uses a read-only transaction and creates no
ledger or schema objects. Applied SQL checksums are immutable: changed drafts
must be tried on a fresh copy, never by editing the ledger to bypass refusal.

`003` enforces non-null space IDs, same-space composite foreign keys and stable
free-savings uniqueness. It is exercised on disposable test clones; it remains
unapplied to the work fixture until the app is converted. A controlled local
cutover requires both `--through=003` and `--allow-cutover`. The final backfill
and constraints share a transaction. Old writers must be stopped for release;
the test actually observes a concurrent unscoped writer waiting on the table
lock and being rejected after cutover. Optional-reference deletion sets only
the reference to null, preserving the space, as supported by
[PostgreSQL composite foreign keys](https://www.postgresql.org/docs/17/ddl-constraints.html).

Integration tests clone the untouched local baseline into a unique database,
exercise rollback/replay/concurrency and all 18 parent relationships, then
delete only the database created by that test run. No source credentials or
hosted database are used by the tests. The current suite is local infrastructure;
portable CI fixtures and the app's full browser/auth tests remain to be added.

`004` aligns variable incomes with the existing form contract: their fixed
amount can be null, while a conditional CHECK still requires a positive amount
for every fixed income. It changes no existing value. The integration suite
proves failure rollback, replay and conservation. It is applied only to fresh
disposable clones at this stage; the named work fixture remains at `002`.
The eventual local cutover must include `--through=004 --allow-cutover`, after
all financial callers have been converted.

If a transaction fails, preserve the work database and read the ledger/phase.
The failed transaction rolls back; earlier committed expansion remains. Retry
unchanged SQL after resolving the reported cause. Never reset the baseline or
restore over a populated work database. After phase `ready`, backfill cannot
reattribute shared data to its author and rollback to the old user-only app is
forbidden. No automatic destructive down migration is supplied.

## Real app against the local copy

```sh
npm run dev:spaces
npm run test:spaces:services
```

The dev command verifies the owned fixture before starting Next on
`http://localhost:3002`. It preserves `.env.local`, removes inherited database
targets, and supplies only the dummy local credentials to the app process.
Authentication still uses the existing Neon Auth service. Compiler outputs use
`.next-spaces-dev`; generated changes to compiler configuration are restored.

The local adapter accepts only the fixed loopback address, port, credentials
and allowed database names. URI query parameters/fragments are rejected and
the pool receives explicit components. Each connection verifies the PostgreSQL
cluster identifier before application SQL. Production mode refuses this adapter.
The default production driver remains Neon HTTP.

The services suite uses real PostgreSQL on a unique disposable baseline clone,
with the server session and Next cache invalidation stubbed. It checks atomic
provisioning, concurrent retries, membership isolation, equal member rights,
rename without switching the current space, and persistent selection. It does
not prove real authentication or the invitation journey. The work fixture is
still in the backfilled phase: space services deliberately refuse activation
until financial actions and navigation have all been converted and cutover is
approved for local recipe testing.

## Financial action conversion in progress

`lib/actions/financial/` contains the explicit-space implementations under
conversion. Every exported action receives a space ID and checks membership.
The historical action modules still serve the historical UI temporarily;
they must be removed when canonical callers are connected, before activation.
The existence of both paths is not evidence that the feature is delivered.

The current tests additionally cover shared cards/categories/debts/savings and
income generation/receipt. Money validation rejects fractional cents and
normalizes binary floating-point noise before SQL. Transfer locks follow a
stable project order; balance checks and both journal entries are atomic.
Fixed income generation and automatic receipt calculate from locked current
templates, preserve monthly overrides, and never rewrite received amounts.
Concurrent writer tests observe real PostgreSQL lock waits before committing;
the observer refreshes statistics snapshots inside its transaction.

## Portable synthetic verification

The private restore certificate and the synthetic CI fixture are separate proofs.
The synthetic fixture uses the historical schema (18 tables / 175 columns), with
42 entirely invented rows. It never loads `.env.local`, a source URL or a backup.
It shares the existing owned Docker fixture, but creates only
`spaces_ci_baseline17`. The private baseline and recipe remain unchanged.

```sh
npm run test:spaces:prepare
MES_FINANCES_TEST_BASELINE=synthetic npm run test:spaces:services
MES_FINANCES_TEST_BASELINE=synthetic npm run test:spaces:db
npm run test:delivery
```

Preparation is repeatable only if both the inputs and the recorded rows/schema
still match. A changed CHECK, default, enum or index causes a visible refusal;
preparation never resets or silently repairs an existing database. Preserve a
failed/changed fixture for diagnosis before deliberately creating another one.
The test suites clone their selected baseline into randomly named owned test
DBs, then delete only their own clones. CI requires the literal `synthetic`
profile. Arbitrary template names or connection URLs are refused.

`.github/workflows/financial-spaces.yml` prepares two independent validation jobs:
quality (including the isolated navigation component tests) and real synthetic
PostgreSQL tests. `Financial spaces required` succeeds only if both jobs report
success. It always materializes; failure, cancellation, skips and missing results
fail the aggregation. Only superseded pull requests may cancel. The workflow
has no deployment, migration of an external database, real mail or private
artifact upload. It uses placeholder Auth/database settings during build.

The quality build uses Next's supported Webpack compiler. Local Turbopack build
was blocked by the environment's CSS-worker port binding restriction; this does
not count as a passing Turbopack build. Google Fonts still requires network
access. No source font or security rule was changed to bypass that requirement.

Run `npm ci`, unit tests, delivery guards, `next typegen`, types, lint and build
from a clean checkout without `.env.local` to rehearse the quality job. Do not
run generating commands concurrently with the recipe: they share next-env and
tsconfig even with different output directories. A durable isolated checkout
under `.local/` can keep the active recipe undisturbed.

Prepared workflow files and local rehearsals do not prove GitHub CI is green.
No push was authorized. Branch protection, a run on the exact SHA, actual
multi-session Auth and Playwright MCP remain separate release requirements.
The runtime profile is `.app-factory/docs/infra/financial-spaces-validation-profile.json`.
