# CURRENT HANDOFF — 2026-09-17

## 🅿️ PARKING LOT

**Task:** release 4.0.6. The three defects that killed ship attempts 1–3 are fixed
and committed; the release itself is the next action.

**Last action:** committed #1180, #1181 and #1163. Guard suite 99 passed, 0 failed.

**Next step, in order:**
1. **`npm run ship`,** end to end, no review pause (John: "I want the releases all
   automated").
2. **Law 17: `npm run test:smoke:deployed`.** A push is not the deliverable; a
   booting site is.
3. **Close on green:** the 8 verified earlier (#678, #1074, #1076, #1085, #1106,
   #1115, #1116, #1124 — drafts in the session scratchpad under `close-drafts/`),
   plus #1180, #1181, #1163, and the seven from 2026-09-15.
4. `.claude/worktrees/fix-1163` is now landed and can be removed. ~40 worktrees
   remain; most are finished work.

## What landed today

| commit | issue | what it fixes |
|---|---|---|
| d4f1bb33 | #1180 | the stall watchdog stops applying once every collected test has reported, so Playwright's shutdown is no longer read as a hang |
| abbcf54e | #1181 | `NO_VERDICT_EXIT`: a run that measured nothing is no longer reported as "this batch broke them", in `release.mjs` **or** `gate-staged-tree.mjs` |
| 24d5ae57 | #1163 | CI runs the ratchet narrowed by `WB_GATE_PROJECTS` instead of hand-writing a Playwright command with no register and no reporters |

#1181 was filed against `release.mjs` alone. `gate-staged-tree.mjs` had the same
defect one level down — it collapsed every non-zero ratchet exit to 1 and printed
"The STAGED tree did not pass. This verdict is about the commit itself", sending
someone to fix staged content over a run that had compared nothing. Both callers
carry the distinction now.

## Lessons this batch, so they are not relearned

- **A guard whose quiet period is shorter than the watchdog's own tick proves
  nothing.** #1180's first guard went silent for 6s against a 3s ack deadline and
  passed against the UNPATCHED ratchet, because the watchdog only looks every 10s.
  Always run a new guard against HEAD before trusting it.
- **A fixture that names its dependencies breaks on the next import — again.**
  `ratchetFixture` copied `scripts/lib/server-down.mjs` by name, so adding one
  import to the ratchet killed all 17 ratchet cases with `ERR_MODULE_NOT_FOUND`
  instead of a verdict. `gateFixture` learned this in #1161 and copies the whole
  directory; `ratchetFixture` now does too. Check the third fixture before it
  bites.
- **A test that hard-codes an exit code encodes yesterday's contract.** Four
  assertions checked `r.code === 1` for a stall, the ceiling and a dead server —
  exactly the conflation #1181 removes. Tier-1 Law 5: the tests were wrong, not
  the code.
- **`cmd | tail -20` reports tail's exit code, not cmd's.** A failing build reads
  as a successful one. Redirect to a file and check `$?`.

## Open questions

- Three single tests failed in ship attempt 2 and were never investigated:
  `api-docs-panels-cover-the-pane` (#1175 covers it), `avatar-shape-and-size`,
  `dropdown-position-and-content`. They may be the #961 flapping class.
- `core.hooksPath` is absolute to the main checkout, so a commit made from a
  worktree runs main's hooks, not the ones it is changing. Still unfiled.

---
docid: 100.1.today
id: current-status
title: Current handoff
project: wb-starter
description: The live parking lot — what the last session did, what is blocked, and what to do next.
status: active
tags: [handoff, status, release]
category: 100.1 — Today
updated: 2026-09-17
author: CieloVista Software
relativepath: docs/_today/CURRENT-STATUS.md
---
