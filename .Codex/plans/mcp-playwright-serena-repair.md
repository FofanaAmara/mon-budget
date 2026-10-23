# Repair Playwright and Serena MCP - 2026-10-23

## Current state
User explicitly authorizes repairing both MCPs, without further questions. Playwright configured with nonexistent @anthropic/mcp-server-playwright (npm404); @playwright/mcp resolves. Serena server responds but get_current_config returns No active project. Existing .serena/project.yml has human/preexisting changes; preserve them. Other MCP configurations may contain secrets: never print whole config.

## Target and gaps
Playwright initializes through MCP, lists tools and performs a harmless browser action. Serena activates Mon Budget and returns real TypeScript symbols. Persist only justified global startup corrections; do not bind global Serena to this single project. No production app, financial data, push or new paid service.

## Steps and dependencies
1. Diagnose actual commands/protocol errors [in progress].
2. Back up only the affected MCP settings privately under project .local (depends1).
3. Replace Playwright command through codex mcp add; retain unrelated settings (depends2).
4. Activate Serena project; if semantic server fails, diagnose logs and fix exact cause (depends1).
5. Verify actual MCP initialize/tools/list and browser/symbol operations; distinguish subprocess proof from tools exposed in this existing chat (depends3,4).
6. Record outcomes and rollback; commit only project tracing/config changes owned by this task, no push (depends5).

## Validation and rollback
Read back named MCP config, confirm unrelated TOML tables unchanged, bounded MCP probe with clean teardown. Restore only affected settings from private backup if correction fails. Do not stop existing unknown processes or replace preexisting project YAML. No app build needed for MCP configuration alone.

## Authorization
Implementation approved directly by user: 'ok fait le et aussi regarde serena ... trouve le et regle le'. Planning-methodology applied without AWM. Estimated5-8k tokens, monetary cost unavailable; no paid service.

## Verified outcome
All repair steps completed. Actual stdio MCP tests passed (25Playwright/23Serena tools), real blank browser page and real TypeScript symbols. Current project auto-detected. Preexisting project YAML preserved. Named config read back correctly; final full settings stable. Initial unrelated aggregate fingerprint drift could not be attributed retrospectively; see session report, no broad rollback. Restart Codex to expose corrected Playwright tools to this existing conversation. This task does not claim completion of the financial feature.
