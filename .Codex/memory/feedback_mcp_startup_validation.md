# MCP availability requires startup verification

What happened: Playwright tools were absent and the feature was blocked, although the UI marked the server enabled. The user prompted deeper investigation. npm returned404 for the configured package. Serena replied but had no active project.
Why it happened: tool exposure, enabled configuration, protocol initialization and project/language-server readiness were treated as the same state.
How to prevent: inspect codex mcp get for the named server, verify the configured package, then initialize the real MCP and call a harmless tool. For Serena, select the project and test a real symbol query; --context codex --project-from-cwd handles startup selection. Record whether the current conversation has reloaded tools separately from subprocess MCP success.
For settings repairs, keep a private full pre-edit snapshot or per-field fingerprints as well as named rollback values; an aggregate unrelated hash detects drift but cannot identify its cause. Never print secrets or blindly roll back concurrent user settings.
