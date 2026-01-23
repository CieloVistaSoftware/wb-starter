# Batch 003 — Tests & Flaky Fixes

Scope: Stabilize Playwright tests and fix flaky behaviors.

Tasks:
- Diagnose failing/flaky tests and add targeted fixes (time waits, element checks)
- Add retries or adjust test harness for known flakiness
- Add or update smoke tests for builder sidebar/overlay and header toggles

Files to check (examples):
- `tests/behaviors/ui/*` (especially failing suites)
- `src/wb-viewmodels/*` where flakiness originates (overlay, async behavior)

Notes:
- Medium risk: affects CI stability; validate by running full test suite.
