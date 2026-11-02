<!-- GENERATED FROM plugins/app-factory/skills/af-devops-delivery/references/rollback.md. DO NOT EDIT DIRECTLY. -->
<!-- Run publisher with --repo-root; project alias docs:devops-delivery -->

# Recovery and rollback

Identify the exact last healthy application SHA/URL and obtain authorization before promotion or rollback. Rerun health and smoke after recovery. Verify the database tool's actual recovery capabilities: prefer a forward repair; a reverse migration needs explicit SQL, isolated representative restore validation, data-loss/compatibility review, accepted production approval and the non-cancellable pipeline. Never assume application rollback reverses data.

Create urgent fixes from refreshed origin/main as hotfix/<purpose>, retaining protected PR, security, migration and release evidence. Record timeline, user impact, affected SHA/deployment/migration, root cause, recovery evidence and follow-up without secrets.

For the optional Vercel/Drizzle procedure, read `../references/rdv-example-rollback.md` only when the verified profile uses it.
