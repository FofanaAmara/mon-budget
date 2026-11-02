<!-- GENERATED FROM plugins/app-factory/skills/af-devops-delivery/references/deploy.md. DO NOT EDIT DIRECTLY. -->
<!-- Run publisher with --repo-root; project alias docs:devops-delivery -->

# Authorized production delivery

Resolve the project's actual deployment trigger, migration owner, endpoint requirements and release health checks. A role or profile never authorizes an operation. If authorization is absent, prepare commands/runbook and continue independent read-only work.

Require local evidence and independent review, protected PR gates, then exact main SHA evidence. Keep migrations backward-compatible with the currently served application and the new version: add before use, nullable/default before backfill/constraint, copy before rename/remove. Classify safety before first execution. For an incompatible change, require an accepted blast radius and multi-release expand/contract plan; do not execute it as an ordinary deploy.

Establish actual ordering: some hosts start a build as soon as main changes. Stop when build-time code needs a missing table/column. Select database connection mode for DDL/locks versus runtime according to verified provider capabilities, never a universal port number. Never seed demonstration data outside a guarded local workflow.

Observe the successful deployment for the exact main SHA and its non-empty URL. Run read-only healthchecks and smoke against that URL. Declare healthy only when migration (if owed), exact deployment, health and smoke are terminal green. On failure keep valid proofs and diagnose the affected stage. A manual redeploy is recovery, not the normal sequence.

Keep secrets in verified secret stores; inspect metadata/presence only. Never print, grep, copy, upload or persist secret values. For the concrete stack read `../references/rdv-example-deploy.md` and `../references/rdv-example-project-profile.md` only after the target matches; these are examples, not defaults.
