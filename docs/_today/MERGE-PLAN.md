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

PICK-UP INSTRUCTIONS (machine-actionable) — for automation/AI agents
- SUMMARY (2 lines): Claim the top-most unchecked item, perform the automated checks, produce a focused PR if required, and update this file and `docs/_today/TODO.md` with a 1-line summary and the PR number. Follow the exact command sequence and success criteria below so other agents can continue from a deterministic state.

- CLAIM PROTOCOL (required)
  1. Create a claim branch: `git fetch origin && git checkout -b auto/<issue>-<agent-id>-YYYYMMDD`.
  2. Immediately append a claim line under the target item in this file: change `[ ]` → `[~claimed <agent-id> <iso-ts>]` and commit the change.
  3. Push the claim branch and open a **Draft PR** with title prefix `[AUTO] <short-task>`.
  4. Add a short PR body with: dependency list, exact commands run, and the automated-check CI matrix to run.

- STANDARD WORKFLOW (exact commands)
  - Fetch base: `git fetch origin main --quiet`
  - Rebase onto main: `git rebase origin/main` (abort and create an ISSUE if rebase conflicts are non-trivial)
  - Run docs sanity: `npm run check:today-docs && npm run check:today-updated`
  - Run Tier‑1: `npm run test:compliance`
  - If Tier‑1 passes: run `npm run test:base` locally (optional confidence step)
  - If all green: push branch, mark PR ready-for-review, and update this checklist to `[x] <PR#>`

- SUCCESS CRITERIA (must all be true to mark `[x]`)
  1. `npm run test:compliance` exits 0 on the branch.
  2. `npm run check:today-docs` and `npm run check:today-updated` both exit 0.
  3. PR is opened (Draft → Ready) and includes a 1-line `docs/_today` entry if any docs changed.
  4. No behavioral regressions in `tests/compliance` specific to files touched (investigate and call out flaky tests in PR body).

- FAILURE & ESCALATION (automated remediations)
  - If **rebase conflicts**: create an ISSUE `type:merge-conflict` with reproduction steps and leave PR as Draft.
  - If **Tier‑1 fails** with clear ESM/CommonJS errors: attempt the minimal fix (convert `.cjs` → `.js`) and re-run. Document changes in the PR. If fix is >20 LOC, open a focused follow-up PR instead and mark original as blocked.
  - If **tests are flaky** (non-deterministic): add `--repeat-each=3 --workers=1` to reproduce intermittents, capture traces, upload to `data/test-results/` and mark PR with `flaky-test` label.
  - If **blocked by infra/permissions** (CI or admin): add `blocked:admin` label and create an ISSUE assigned to repo admins.

- PER-ITEM AUTOMATION CHECKLIST (what the AI must do for EACH unchecked item)
  - PR #98 — `feat/tests/tier1-gate-impl`
    - Preconditions: docs + ESM conversion merged to main (if not, mark as blocked).
    - Commands: `git checkout <branch> && git rebase origin/main && npm run test:compliance && npm run check:today-updated`
    - Deliverables: GH workflow YAML updated, `docs/` entry added, PR ready.
  - PR #99 — `feat/tests/pr-labeler-impl`
    - Preconditions: Tier‑1 gate merged or mergeable.
    - Commands: run labeler locally `node scripts/retroactive-pr-labeler.js --max 20` (dry-run) then `--apply` only after approvals.
    - Deliverables: labeler workflow + comment template; unit test or dry-run log included in PR.
  - PR #100 — `chore/docs/announce-test-policy-impl`
    - Preconditions: docs restored and ESM conversion merged.
    - Commands: `npm run check:today-docs && npm run check:today-updated`
    - Deliverables: announcement doc, changelog entry, and `docs/_today` pointer.
  - PR #101 — `feat/tests/label-open-prs-impl`
    - Preconditions: PR labeler (99) merged.
    - Commands: run `node scripts/retroactive-pr-labeler.js --max 200 --apply` **only** after Tier‑1 gate and labeler are live on main.
    - Deliverables: scheduled workflow, runbook, and a short report CSV of labeled PRs in `data/retro-labeler-report.csv`.
  - PR #102 — `feat/tests/auto-close-needs-tests-impl`
    - Preconditions: labeler in prod for >=72 hours.
    - Commands: validate dry-run, then enable auto-close with a 14-day window for `needs-tests` labeled PRs.
    - Deliverables: workflow + test cases demonstrating safe closure and reopen process.
  - PR #104 — `chore/branch-protection-config-impl`
    - Preconditions: Tier‑1 gate merged and owners notified.
    - Commands: prepare branch-protection JSON and an admin-facing apply script (do **not** run apply).
    - Deliverables: docs/BRANCH_PROTECTION.md + sample `gh api` command to apply protections.

- REPORTING (how to leave breadcrumbs)
  - Update `docs/_today/TODO.md` with a 1-line note for each substantive change. Example:
    - `- [ ] PR #98 — add Tier‑1 gate — AI-agent-7: rebased, fixed CI, ready for review`
  - Update `docs/_today/MERGE-PLAN.md` by changing the checklist state and appending `— PR #NN`.
  - Attach local run logs to the PR and put a short summary in the PR body.

- IF YOU CANNOT COMPLETE (stop condition)
  - Create an ISSUE prefixed `auto/blocked/` with the failing command output and add the `blocked:ai` label.
  - Leave the PR as Draft and update MERGE-PLAN with `[~blocked <agent-id> <iso-ts>]`.

Automation agents: follow this protocol exactly so subsequent agents can continue work deterministically.
- Run Tier‑1 locally: `npm run test:compliance`
- Run full suite (CI-only): `npm run test:all`
- Verify docs/_today references: `npm run check:today-updated`
- Run retroactive labeler (dry-run): `node scripts/retroactive-pr-labeler.js --max 200`

NOTES
- Admin action required to enable branch-protection that requires Tier‑1 to pass. PR #104 provides the sample config.
- Non-trivial test failures should be turned into focused follow-up PRs; keep merges small and reversible.

---

If you are an automation agent: claim the top-most unchecked item, follow the pick-up instructions, and update this file before pushing the PR.