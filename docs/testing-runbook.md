# Testing & CI — Runbook (developer-focused)

This concise runbook explains how to run tests locally, gather artifacts, and how CI runs the suite in this repository. It complements `CONTRIBUTING.md`, `docs/CommittingFixes.md`, and `docs/mcp.md`.

## Goal
- Fast feedback for daily development (short runs by default).
- Reliable, ordered full pipeline for CI and thorough validation.

---

## Quick commands (recommended)
- Fast (developer):
  - npm test
- Full (ordered):
  - npm test -- --full
  - npm run test:ordered
- Focused:
  - npm run test:compliance
  - npm run test:integrity
  - npx playwright test tests/issues/that-one.spec.ts --reporter=list
- Interactive/debug UI:
  - npm run test:ui

## What changed (important)
- `npm test` is a safety-wrapper: **fast-by-default** (short feedback). Use `--full` or `CI=true` to run the full ordered pipeline (compliance → fast → base → behaviors → regression).
- CI automatically treats the run as `--full` (the wrapper checks `CI=true`).

## MCP and tests
- If a test requires the local MCP server, start/probe it first:
  - npm run start:mcp
  - npm run mcp:healthcheck -- 52100
- See `docs/mcp.md` and the CI snippet in this repo for examples integrating MCP into test jobs.

## Producing Playwright traces & artifacts
- Record a trace for a failing test:
  - npx playwright test --project=compliance --trace=on tests/that.spec.ts
- Local artifact locations:
  - data/test-results/**/trace.zip
  - data/test-results/.last-run.json
- When opening a PR for flaky or failing tests: attach `trace.zip` and include the failing test command in the PR description (see `CONTRIBUTING.md`).

## CI & GitHub Actions
- Notable workflows: `.github/workflows/ci-compliance.yml`, `manual-compliance.yml`, `server-smoke.yml`.
- To run a manual dispatch with trace (GH CLI):
  - gh workflow run "Manual Compliance (dispatch)" -f ref=main -f tests="tests/compliance/that.spec.ts" -f trace=true

## Troubleshooting (fast)
- Long runs unexpectedly: you invoked the ordered pipeline — run `npm test` for a fast feedback loop.
- Tests hang on setup: check `npm run mcp:healthcheck -- 52100` and server logs (`npm run start:mcp -- --foreground`).
- Missing artifacts after CI: open the Actions run and download the `Artifacts` for the job that executed the tests.

## Best practices (developer)
- Run `npm test` while developing; run `npm test -- --full` before pushing a large change.
- Create/attach a Playwright trace for flaky failures and reference it in the PR.
- Add focused tests that run quickly and are stable; avoid adding slow end-to-end checks to the fast path.

---

Related docs
- `CONTRIBUTING.md` — test / artifact publishing details
- `docs/CommittingFixes.md` — PR & validation workflow
- `docs/mcp.md` — MCP usage for tests
- `docs/builder-testing.md` — component-level test guidance

If you'd like, I can also add VS Code tasks / keyboard shortcuts for the common commands (fast run, full run, trace).