# Session - 2026-10-23 - Playwright and Serena MCP repair

**Plan :** `.Codex/plans/mcp-playwright-serena-repair.md`.

## Problem and cause
Playwright was enabled but configured as npx -y @anthropic/mcp-server-playwright, which returned npm404. Activation in the UI did not mean the server could initialize. The official @playwright/mcp resolved to0.0.83 and was pinned to that verified version.
Serena was responding to initial_instructions, but get_current_config failed with No active project. It was launched in default desktop-app context without automatic project selection. Activation of Mon Budget succeeded, followed by a genuine TypeScript symbol overview.

## Repair
Global named configuration updated through codex mcp add:
- playwright: npx -y @playwright/mcp@0.0.83
- serena: uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context codex --project-from-cwd
The project-from-cwd flag is supported by the installed CLI and intended for Codex; it finds the nearest .serena/project.yml or .git. It avoids binding every global session to Mon Budget. No project YAML edit, dependency edit or application code change.

## Actual verification
Private probe .local/mcp-repair/verify-mcp.cjs uses the installed MCP SDK and stdio transport to launch the actual configured commands, initialize MCP, list tools and call them. It does not use Playwright browser CLI as a substitute.
- Playwright:25tools, browser_navigate about:blank, browser_snapshot confirming the page, browser_close, successful client teardown.
- Serena:23tools in Codex context, initial_instructions, get_current_config confirming automatic Mon Budget detection, get_symbols_overview returning validInvitationReturn and invitationAuthHref. LSP shut down with exit0.
- Probe session23656exit0. Private protocol-verification.json and final-verification.json passed.
- This proves server operation, not the financial feature E2E. Playwright tools are not yet exposed in the already-running conversation; restart Codex to reload them.

## Preservation and diagnostic limits
Original named settings backed up privately under .local/mcp-repair with restricted permissions. Current full configuration was also saved privately before confirmation, never committed or printed. Preexisting .serena/project.yml SHA256 is unchanged. next-env and oldCS files untouched.
Initial fingerprint of unrelated settings differed after the first repair commands. The initial snapshot retained only named settings plus the aggregate fingerprint, so it cannot attribute that drift to a particular field or actor. No blind rollback of unrelated current settings. Subsequent full snapshot comparison and identical repetitions of BOTH codex mcp add commands produced zero changed settings; final config remained stable through the probe. Do not claim complete initial-to-final unrelated equality.
Offline uvx with floating GitHEAD failed while trying to resolve/update its Git requirement. Reading help from the already-installed binary worked; actual configured online startup subsequently passed. No unrelated process was stopped. One verification script initially referenced a copy not created because of the earlier failed assertion; final preservation check correctly used the original SHA256 captured before probing.

## Outcome and rollback
Both repairs verified. No app build necessary for these configuration-only changes, no paid service, push, deployment, financial DB or Auth mutation. Restore only the affected named settings from private original-mcp-settings.json if needed; never overwrite whole current global config with an obsolete snapshot.
