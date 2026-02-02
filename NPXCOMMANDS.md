# NPX & Playwright Commands — quick reference (PowerShell-friendly) 🚀

Purpose: centralize the precise, copy-paste-safe `npx` and Playwright commands used in this repo and list the common mistakes to STOP repeating.

## Quick checks before running tests ⚠️
- Start the dev server: `npm start` (wait for "Listening" log).
- Start MCP if tests require it: `npm run start:mcp` and verify with `npm run mcp:healthcheck`.
- Ensure you're in the project root (where `package.json` lives).

---

## Common, PowerShell-safe commands (copy-paste) 🔧
- Run a single test by name (pattern matching):
  npx playwright test 'tests/behaviors/ui/builder-api.spec.ts' -g 'remove' --timeout=120000 --trace=on

- Run an entire spec file:
  npx playwright test 'tests/behaviors/ui/builder-api.spec.ts' --timeout=120000

- Run a single test by file + line-number (Playwright):
  npx playwright test tests/behaviors/ui/builder-api.spec.ts:42

- Run Playwright with debug UI:
  npx playwright test --ui

- Run only failed tests from the previous run:
  npx playwright test --repeat-each 1 --max-failures=1

- Helpful flags:
  --timeout=120000   # increase default (ms)
  --trace=on         # captures trace for failing tests
  -g 'pattern'       # test-title grep (simple substring is safest)

---

## PowerShell quoting & common pitfalls (short) 🧩
- Use single quotes around file paths and `-g` patterns to avoid PowerShell interpreting parentheses or `$`.
- DO NOT use unsupported flags (example: `-q` is not a Playwright option).
- If Playwright reports "No tests found", double-check the -g pattern and quoting; try a looser substring (e.g. `-g 'remove'`).

---

## Why commands fail (root causes) — and how to stop them ✅
- Wrong CLI flag (typo) → read the error ("unknown option") and remove the flag.
- Overly specific grep pattern → use a simpler substring or escape special chars.
- Required services not running (dev server / MCP) → start them first.
- Quoting mistakes in PowerShell → prefer single quotes around test paths/patterns.

---

## Troubleshooting checklist (follow in order) 🧭
1. Are you in the repo root? `pwd` / check `package.json` exists.
2. Is the dev server up? `npm start` → wait for "Listening".
3. Is MCP required & healthy? `npm run start:mcp` then `npm run mcp:healthcheck`.
4. Run a simple smoke test: `npx playwright test tests/behaviors/ui/builder-api.spec.ts -g 'add()'`
5. If "No tests found": relax `-g` to a substring and re-run.
6. If a test times out: increase `--timeout` and enable `--trace=on`.

---

## Examples (copy-paste) 📋
- Single failing test with trace (recommended):
  npx playwright test 'tests/behaviors/ui/builder-api.spec.ts' -g 'remove' --timeout=120000 --trace=on

- Run the whole builder API file:
  npx playwright test 'tests/behaviors/ui/builder-api.spec.ts' --timeout=120000

- Start server + run one test (two commands):
  npm start
  npx playwright test 'tests/behaviors/ui/builder-api.spec.ts' -g 'remove' --timeout=120000

---

## Recommended CI settings (for maintainers) 🏷️
- Use explicit file-level runs in CI for flaky areas: `npx playwright test tests/behaviors/ui/builder-api.spec.ts -g 'remove' --trace=on`.
- Gate PR merges on `--trace=on` for failing tests to capture artifacts.

---

## Short "STOP" checklist (read before you run) ✋
- Stop: adding unknown CLI flags (check the error first).
- Stop: over-anchored `-g` patterns — use simple substrings.
- Stop: running tests without the dev server or MCP when required.

---

If you want, I can: add this to the repo README, open a PR that enforces `--trace=on` for failures, and run the failing Builder test now (with trace).