
# CLAUDE.md - WB Behaviors Project

## Session Start (DO THIS FIRST - NO EXCEPTIONS)

1. **We are not using Claude.ai web — do not start a Chrome task. Instead, use Claude Desktop and you have full MCP access.**
2. **Read `docs/claude/TIER1-LAWS.md`** — the 10 non-negotiable rules
3. **Read `docs/_today/CURRENT-STATUS.md`** — current project state
4. **Use `recent_chats`** — continue from last session, don't start blind
5. **Identify task domain** → load only the relevant section from `docs/claude/TIER2-DOMAIN-GUIDES.md`
6. **Start working** — no questions, no fumbling
7. **Acknowledge that you will not use Claude.ai web, but only use MCP access.**

### What NOT To Do
- ❌ Never ask John to upload files — you have MCP access
- ❌ Never ask "what are you working on" — read the status file
- ❌ Never run tests synchronously — see async syntax below
- ❌ Never skip reading Tier 1 — that's how regressions happen

---

## Documentation Tier System

All project docs are organized into 3 tiers. See `docs/claude/README.md` for the full index.

| Tier | When | What |
|------|------|------|
| **Tier 1 — LAWS** | Every session | 10 rules that prevent regressions |
| **Tier 2 — DOMAIN GUIDES** | When task touches that area | Behavior specs, testing, CSS, builder, schemas, etc. |
| **Tier 3 — REFERENCE** | Only if John points you there | Articles, audits, migration history |

---

## Quick Reference

**Owner:** John (Cielo Vista Software)  
**Architecture:** WBServices pattern, Light DOM only, composition over inheritance — capability is applied to an element by behavior functions, never acquired by subclassing a behavior base class  
**Project location:** `C:\Users\jwpmi\Downloads\AI\wb-starter`

### File and MCP Access
- **Files:** the built-in Read, Write, Edit, Glob and Grep tools. There is no filesystem MCP server; it was removed on 2026-09-14 (#1166)
- **npm commands and async tests:** the `wb-starter` MCP server, started from this repo's `.mcp.json`

### File Structure
```
src/wb-models/{name}.schema.json   — Behavior schemas
src/wb-viewmodels/{name}.js        — Behavior/logic
src/styles/behaviors/{name}.css    — Styles (migrated from behaviors/)
docs/claude/TIER1-LAWS.md          — Read every session
docs/_today/CURRENT-STATUS.md      — Current work status
```

---

## Async Test Execution (MANDATORY)

All tests run asynchronously. **Never block on anything.**

| Mode | When | Lock | Status File |
|------|------|------|-------------|
| **Suite** | no spec file (e.g., `--project=compliance`, `--grep`, or bare) | `data/test.lock` — one at a time | `data/test-status.json` |
| **Single** | specific `*.spec.ts` file | No lock — parallel OK | `data/test-single/{specname}.json` |

**MCP syntax:**
```
npm_test_async()                                           # full suite (only if John asks; Nightly runs it)
npm_test_async(filter: "--project=compliance")             # filtered suite
npm_test_async(filter: "tests/behaviors/badge.spec.ts")    # single spec
```

**Workflow:** Launch → poll status 1x/min → report to John 1x/min → if 3+ failures: STOP and diagnose.

**Only John runs sync tests.** The `npm_command` tool blocks all test commands.

---

## Commits, CI and Releases

- **Commit hook:** fast checks only (~30s) that CI does not run — version stamp, lint ratchet on staged files, spec-collection check, register-only-shrinks check, staged control-byte check. No Playwright on commit.
- **PR CI:** `ci-tests.yml` runs one Playwright check per category on windows-latest, plus "Gate scripts self-test". Information, not a merge gate.
- **No full suite during the day.** Run single specs or a filtered category for the work at hand. The full suite runs in **Nightly** after "park".
- **main moves freely.** A push to main is not a deploy. The public site updates only when Nightly cuts a release.

## Release Line — say where everything stands, every time

John, 2026-10-02: "you have to communicate release information so that it keeps
our discussions in sync." Start every status update (and repeat after any merge,
release or push) with one line, in this order, in these words:

> **Release vX.Y.Z** (tagged MM-DD) · **main** = vX.Y.Z +N (not released) · **live site** = … · **PR #NNNN** = +M on main, not merged · **your local** = what John's badge shows (when known)

- **"Release" means a GitHub tag `vX.Y.Z`, nothing else.** Merged-but-untagged code is "main, not released". Never call `+N` code by the bare release number.
- **Distances are commits since the tag**, exactly as the version badge counts them (`v1.0.0 +41`, `*` for local edits), so what Claude says and what John's badge shows always match.
- Get the numbers from git (`git describe --tags --match "v[0-9]*"`, `git rev-list --count tag..origin/main`), never from memory.

## Filing an Issue — every time, no exceptions

John, 2026-10-02, after five issues went up without a Signature block: "are you
saying we didn't tell you what to do?" The rules exist; read them before filing.

1. **Signature block** per `docs/standards/ISSUE-SIGNATURE-BLOCK.md`: `kind` (one of the six), `subject`, `observed`, `expected`; `detect` + dated `evidence` when computable; `related` when a family exists. Never `status`/`state`/`shipped`/`released`/`commit`.
2. **Exactly one priority label**, `priority:1`–`priority:5` (Tier-1 Law 15).
3. **After filing, validate**: parse the posted body with `parseSignature()` from `scripts/lib/signature-schema.mjs` (or `node scripts/check-issue-signatures.mjs --number N`) and fix anything it reports before moving on.

## Merging — Claude merges when the tests say so

John, 2026-10-02: "you trigger the merges when the tests indicate to do it."

- Claude merges its own PRs when **every check on the PR's current head commit is green** and there is no merge conflict. No asking first.
- **Any red check blocks the merge**, even one Claude believes the PR did not cause. Claude fixes it, or fixes the flaky test, and lets CI answer again. A merge is never argued past a red check.
- After merging, report with the release line (above) and say when the change is live.

## End of Session — "park"

When John says **"park"**:

1. Update the 🅿️ PARKING LOT in `docs/_today/CURRENT-STATUS.md` (task, files touched, last action, next step, open questions).
2. Merge the day's finished PRs into `main`.
3. Trigger the **Nightly** workflow: `gh workflow run nightly.yml --ref main` (`.github/workflows/nightly.yml`, workflow_dispatch). Backup: it also runs at 08:00 UTC (2am CST) and skips if main's HEAD is already a tagged release.

Nightly runs the full suite on main against the known-failures register. No new failures → release cut (`scripts/ship.mjs`: What's New in `data/releases.json`, version bump, tag, GitHub release, npm publish) and the site deployed to GitHub Pages from that commit. New failures → no release, one `priority:2` issue linking the run.

**Next morning:** report "vX.Y.Z released" (then run `npm run test:smoke:deployed`, Law 17) or "no release, these failed" with the issue link.
