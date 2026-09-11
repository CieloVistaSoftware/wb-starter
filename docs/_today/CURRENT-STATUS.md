# CURRENT HANDOFF — 2026-09-11

## 🅿️ PARKING LOT

**Task:** ship the release batch that has been blocked since 2026-09-09.

**Last action:** committed the batch. The gate's two remaining new failures were
traced with probes and fixed; both specs verified 10/10 alone, the workspace one
as test 1 on a cold page, which is the exact condition it failed under.

**Next step, in order:**
1. The commit's gate verdict. On a pass: `npm run ship` end to end, no review
   pause (John: "I want the releases all automated").
2. Law 17: `npm run test:smoke:deployed`.
3. Close what the release unblocks: #1070, #1075, #1078, #1102, #1103, #1104,
   #1106, #792. Four of those (#1070, #1075, #1078, #792) were reshaped for the
   signature validator in parallel; confirm each passes
   `node scripts/check-issue-signatures.mjs --number N` before closing.
4. Commit the two held-back changes, each through its own gate:
   - the article -> card registry change (saved in the session scratchpad:
     'article': 'card', x-article removed, index.js redirect removed, the dead
     article() deleted). It took the gate from 2 failures to 10 when bundled,
     because removing x-article changes the behaviors catalogue four specs
     assert over. Those specs must change in the same commit.
   - wb-starter CLAUDE.md and docs/claude/TIER1-LAWS.md step 1 still name
     `list_allowed_directories`; the filesystem MCP server was dropped.

## What this batch fixes

| issue | fix | proof |
|---|---|---|
| #1102 | an empty behavior fills from the curated example, not its field names; `data-` counts as authored | tests/behaviors/empty-behavior-teaches-by-example.spec.ts |
| #1103 | article.schema.json restored from 0 bytes; parse gate added | tests/compliance/every-schema-parses.spec.ts |
| #1104 | the hooksPath check asserts the guarantee, not a location | tests/regression/every-push-to-main-is-a-release.spec.ts |
| #1106 | the gate is bounded (75/80 min) and holds the machine lock; single runs are held while a suite runs; a blocked gate is notified on release, never polls | scripts/lock-permutations.schema.json via scripts/test-lock-guards.mjs, 47/0, run in pre-commit |
| #792 | x-footer renders `links` and `social` | tests/behaviors/every-declared-attribute.spec.ts |
| — | cardstats compact/large/minimal never applied (keyed on classes a8a7362e stopped injecting) | card-typed-variants-no-op.spec.ts, now waits on animation `finished` |
| — | the workspace spec read the page mid-entrance (site.css fadeIn slides 10px) | behaviors-workspace-single-scroll.spec.ts, now waits on whenIdle + the page's own animations |

## Lessons written into this batch, so they are not relearned

- **A logged cause does not prevent a recurrence; only an enforced one does.**
  The five-hour gate hang was already recorded in Law 4, #1072 and the agent's
  own notes. It recurred because nothing refused the second run.
- **Permutations come from a schema, not from hand-picked cases** — params, one
  simple working case, a schema with min/max/edges and an oracle, tests
  generated from it, run red first. The lock gap survived because every
  hand-written case held one kind of run against its own kind.
- **Values read while an animation is moving are not facts.** Both of the last
  two gate failures were a measurement taken mid-transition. Wait on
  `animation.finished` — the browser's own notification.
- **Three diagnoses of the workspace failure were wrong** (a half-built page, the
  nav rail's max-height, header.css padding). A probe that reproduced the
  failing condition exactly — first, on a cold page — found it in one run.

## Open questions

- The page entrance animation briefly lets #siteBody scroll on every page load.
  Whether readers see a scrollbar flash depends on `.site__body` clipping.
  Recorded on #1020; a product fix is a design choice (opacity-only, or
  `overflow: clip`).
- The general form of the cardstats bug: card.css variant rules keyed on classes
  that a8a7362e stopped injecting. Fixed for cardstats only; the rest belongs
  to #969 / #914.
- `maxParallelSingle: 2` in lock-permutations.schema.json lets two single-spec
  runs share the machine, which #1072 says collide on the port. Policy call.
