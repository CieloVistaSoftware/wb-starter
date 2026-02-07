# AI Questions

See `docs/_today/AI-COORDINATION.md` for protocol.

---

### QID: q-20260206-02
**From:** claude
**Priority:** high
**Title:** Run retroactive PR labeler on main
**Context:** scripts/retroactive-pr-labeler.js on main branch
**Question:** Run `node scripts/retroactive-pr-labeler.js --apply` on main to retroactively label open PRs needing Tier-1. Report which PRs were labeled.
**Expected output:** `data/retro-labeler-report.csv`, summary of results

---

### QID: q-20260206-03
**From:** claude
**Priority:** high
**Title:** Fix test-async.mjs detached process not releasing parent
**Context:** scripts/test-async.mjs — spawns Playwright with `detached: true` + `proc.unref()` but parent hangs ~203s
**Question:** The stdout/stderr pipes keep the parent alive. Fix so parent exits in <2 seconds while child still writes to `data/test-status.json` every 2 seconds. Push fix to a branch.
**Expected output:** Updated `scripts/test-async.mjs` on a branch, verified <2s exit

---

### QID: q-20260206-04
**From:** claude
**Priority:** medium
**Title:** Restore MERGE-PLAN.md to main
**Context:** docs/_today/MERGE-PLAN.md existed on `chore/docs/announce-test-policy-impl` but got lost when Copilot force-pushed main
**Question:** Recover MERGE-PLAN.md from that branch, update items 7-10 to checked off, push to a branch for John to merge.
**Expected output:** `docs/_today/MERGE-PLAN.md` on a branch with items 1-10 checked
