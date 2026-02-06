# Merge plan — bring all branches/PRs to `main`
**Updated:** 2026-02-06 02:30

Goal: merge outstanding branches/PRs to create a single common base on `main`. Items are ordered and use checklist `[]` syntax so downstream automation/agents can claim work by checking a box and pushing a PR update.

PROCESS (high-level)
- Checkout the branch
- Run Tier‑1 locally: `npm run test:compliance`
- Fix failures (make minimal, document changes in `docs/_today/TODO.md`)
- Push branch and set PR to 'ready for review'
- Merge when Tier‑1 passes

MERGE ORDER (work items)
1. [x] `chore/move-todos-to-todo-md-20260206` — PR created & pushed (docs: move TODOs) — PR: n/a (branch pushed)
2. [x] `chore/move-completed-extractions-to-fixes-20260206` — PR created & pushed (docs: move COMPLETED → FIXES) — PR: n/a (branch pushed)
3. [x] `fix/restore-today-from-stash` — PR #105 — restore lost `docs/_today` content (review & merge)
4. [x] `chore/convert-cjs-to-esm-20260206` — branch pushed (scripts converted to ESM) — PR: create if missing
5. [x] `feat/tests/tier1-gate-impl` — PR #98 — add fast Tier‑1 blocking job (merge after docs + ESM conversion)
6. [x] `feat/tests/pr-labeler-impl` — PR #99 — PR labeler automation (merge after Tier‑1 gate)
7. [ ] `chore/docs/announce-test-policy-impl` — PR #100 — announcement + docs updates (merge early; docs must land before enforcement)
8. [ ] `feat/tests/label-open-prs-impl` — PR #101 — retroactive labeling workflow (run after Tier‑1 gate + labeler are merged)
9. [ ] `feat/tests/auto-close-needs-tests-impl` — PR #102 — auto-close stale needs-tests PRs (depends on labeler)
10. [ ] `chore/branch-protection-config-impl` — PR #104 — branch-protection docs & sample (admin to apply after Tier‑1 gate is live)
11. [ ] run `scripts/retroactive-pr-labeler.js --apply` on `main` (after CI merges) — retroactively label open PRs needing Tier‑1
12. [ ] announce enforcement window (48‑hour grace) and run final sweep (docs + tests)

PICK-UP INSTRUCTIONS (for other AI / automation)
- To claim an unchecked item:
  1. Create local branch: `git fetch origin && git checkout -b <branch>`
  2. Run Tier‑1: `npm run test:compliance`
  3. Fix failures, update `docs/_today/TODO.md` with a 1-line note, commit, push, set PR ready.
  4. Update this checklist: change `[ ]` → `[x]` and add PR number.

COMMANDS (quick)
- Run Tier‑1 locally: `npm run test:compliance`
- Run full suite (CI-only): `npm run test:all`
- Verify docs/_today references: `npm run check:today-updated`
- Run retroactive labeler (dry-run): `node scripts/retroactive-pr-labeler.js --max 200`

NOTES
- Admin action required to enable branch-protection that requires Tier‑1 to pass. PR #104 provides the sample config.
- Non-trivial test failures should be turned into focused follow-up PRs; keep merges small and reversible.

---

If you are an automation agent: claim the top-most unchecked item, follow the pick-up instructions, and update this file before pushing the PR.