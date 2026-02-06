# Announcement: Tier‑1 local test enforcement (short)
**Effective (enforcement) date:** 2026-02-09 (48‑hour grace window)

Summary
- Starting on the enforcement date above, **Tier‑1 (compliance)** will be the default, required local check for commits and PRs. Local synchronous runs of the full test-suite are disallowed for automation; use the async test runner for CI checks.

What changes for developers
- `npm test` (local) will run the fast Tier‑1 check by default.
- Pre-push hooks will block pushes if Tier‑1 fails locally.
- Full test suites (regression, behaviors, performance) will continue to run in CI only.

If your PR touches `docs/` you must add a one-line entry to `docs/_today/TODO.md` or `CURRENT-STATUS.md` describing the change.

Quick commands
- Run Tier‑1 (local fast):
  - Human: `npm run test:compliance` (John may run sync in emergencies)
  - Automation: `npm_test_async` (filter: compliance) + poll `data/test-status.json`
- Verify docs/_today references: `npm run check:today-updated`

Rollout & enforcement
- 48‑hour grace period for the first enforcement window (until 2026-02-09). During the grace window the pre-push hook will warn but not block; after the window it will block.
- Retroactive labeling of existing PRs will run after the Tier‑1 gate is merged to `main`.

If you need an exception
- For debugging only: convert your PR to Draft, document the failing tests in the PR body, and request a temporary exception from the repo admins. Exceptions are rare and must be timeboxed.

Admin actions (what maintainers will do)
- Enable branch-protection requiring the Tier‑1 check on `main` after CI gate is merged (see `docs/BRANCH_PROTECTION.md`).
- Monitor retroactive labeler run and approve/assist fixes for high‑value PRs.

Questions / help
- For help: open an issue with the `help:test-policy` label and include `docs/_today` entry describing the problem.

--
(Prepared by automation — see `docs/_today/MERGE-PLAN.md` for the rollout checklist and machine-actionable pickup instructions.)
