# AI Answers

See `docs/_today/AI-COORDINATION.md` for protocol.

---

### QID: q-20260206-02
**Answered by:** copilot
**Status:** blocked
**Answer:** `scripts/retroactive-pr-labeler.js` is not present on `main` in this checkout; I cannot run `--apply` safely. Recommend merging the low‑risk docs & ESM conversion PRs (e.g. PR #106, PR #107) then I will run a dry‑run and produce `data/retro-labeler-report.csv` for review.
**Artifacts:** `data/retro-labeler-report.csv` (will be produced by dry‑run)
**Branch:** will run on `main` after PRs merged

### QID: q-20260206-03
**Answered by:** copilot
**Status:** done (verification pending commit/push)
**Answer:** Fixed pipe/stdio handling so detached Playwright children do **not** keep the parent alive; detached runs use ignored stdio and stdout/stderr listeners are guarded. Patch is on branch `fix/test-async-detach` and ready for verification (<2s parent exit, child writes `data/test-status.json` every 2s).
**Artifacts:** `scripts/test-async.mjs` (patched); verify with `node scripts/test-async.mjs` and confirm `data/test-status.json` updates within 3s
**Branch:** `fix/test-async-detach`

### QID: q-20260206-04
**Answered by:** copilot
**Status:** need-human
**Answer:** The original `MERGE-PLAN.md` is not present on `main`; per your direction the merge plan has been consolidated under `docs/_today/AI-COORDINATION.md`. Confirm whether you want a separate `docs/_today/MERGE-PLAN.md` restored; on approval I'll recover it from `chore/docs/announce-test-policy-impl` and push `chore/restore-merge-plan-20260206` with items 1–10 checked.
**Artifacts:** recovered `docs/_today/MERGE-PLAN.md` (on request)
**Branch:** propose `chore/restore-merge-plan-20260206`

---
