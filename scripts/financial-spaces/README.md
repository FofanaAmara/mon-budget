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
