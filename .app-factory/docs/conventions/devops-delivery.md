<!-- GENERATED FROM plugins/app-factory/skills/af-devops-delivery/references/operating-model.md. DO NOT EDIT DIRECTLY. -->
<!-- Run publisher with --repo-root; project alias docs:devops-delivery -->

# Delivery operating model

Give each proof one authoritative owner. Local checks shorten feedback; remote checks authorize integration; production checks authorize release health. Never remove an existing proof for speed. Parallelize independent evidence, cache immutable inputs, target local feedback, and retain an exhaustive path.

Inspect the actual project commands, path classifier, required checks and provider capabilities before adapting anything. Unknown changed paths take the full gate. Keep a stable unconditional required result that fails closed on failure, timeout, cancellation or unexpected skip. In GitHub Actions use `always()` and require explicit success for each dependency; other providers must prove equivalent behavior.

Cancel only superseded PR validation. Never cancel main migrations, release validation, health, smoke or rollback. Do not duplicate expensive evidence for the same SHA on both feature push and PR. A squash merge creates a different SHA: validate the evidence owed to that SHA before production operations.

Use feature/fix/hotfix → protected PR → main. No staging promotion branch is required. Auto-merge is optional and authorized separately: prove protection, head/base, green required checks, review policy, mergeability and resolved conversations first. Solo maintenance removes only a fictional second account, never a technical gate.

Record observable durations and run count per SHA. Define sampling/percentile rules in the project profile; never fabricate measurements. The RDV+ collector's exit 2 `insufficient-sample` is an open measurement, not a release failure. Metrics may report metadata unavailable while required evidence remains fail closed. Notify actionable failures, integration and terminal release health, not superseded runs.

For the optional GitHub/Vercel/Supabase/Next projection, read `../references/rdv-example-operating-model.md` only when applicable, and verify every project setting before use.
