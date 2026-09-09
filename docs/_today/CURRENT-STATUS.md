# CURRENT HANDOFF — 2026-09-08 (night)

## PARKING LOT

**The suite could report success for doing nothing, and had been able to since
before any of tonight's issues were filed. That is now gated. It is the most
important thing on this page.**

John: *"nothing here can distinguish a test that passed from a test that never
ran ... is a serious oversight, should not have ever happened."*

He is right. Playwright exits `0` when a spec collects **zero** tests, so a file
that throws at module scope — or that no project's `testMatch` covers — reports
success from every gate, runner and status file in this repo. It appears in the
listing, carries a name describing a real guarantee, and is admissible as release
evidence.

**Seven historical sightings, one hole:** #975 (twelve days of "Total: 0 tests"
read as a passing gate), #1049, #1041, #1085, the doc-viewer end-key dead
fixture, plus **two specs written tonight** that collected nothing and reported
green — one of them the spec written to fix another instance of it.

**Fix:** `scripts/check-spec-collection.mjs`, wired into `.husky/pre-commit`.
Lists (does not run) every test and compares what collected against what is on
disk. **First run found 3 spec files that had never executed once** — 6 `test()`
calls, 7 `expect()` assertions. Now 602/602 collecting.

---

## What is committed

`53b44913` — #1076 (a push to main is a release), #1082 (porcelain parsing —
and the reason #1071 never worked), #1081 (generated output untracked), #1077
(Fix Viewer issue link), #1083 (nav: Demos + A.I. Docs removed).

`0e143e38` — #1085 (element scanner counted a tag named in a comment), #1070
(dead `x-demo` selector), #1086 (template docs), the End-key fixture repair.

## What is NOT committed — 111 files in the working tree

Everything below this line is uncommitted. **Commit before anything else.**

| area | files |
|---|---|
| #1091 collection gate | `scripts/check-spec-collection.mjs`, `tests/compliance/every-spec-collects-a-test.spec.ts`, `.husky/pre-commit`, `playwright.config.ts` (added `issues/**`, `debug-css.spec.ts` to testMatch) |
| #1093 doc coverage | `tests/compliance/every-behavior-is-documented.spec.ts`, `scripts/sync-attribute-descriptions.mjs`, **142 attribute descriptions** across `src/wb-models/*.schema.json` + `docs/behaviors/*.md` |
| #1094 x-ready | `src/core/ready-signal.js` (new), `src/core/wb.js`, `src/core/wb-lazy.js` |
| #1090 issue state | `scripts/issue-state.mjs`, `scripts/lib/test-citations.mjs`, `tests/regression/issue-state-finds-an-unrecorded-test.spec.ts` |
| #1096 classes | `docs/standards/CSS-CLASS-CONVENTION.md` (new), `scripts/lib/behavior-classes.mjs`, `scripts/document-behavior-classes.mjs`, `tests/behaviors/default-gui-census.spec.ts` |
| #1094 opt-out docs | `scripts/backfill-opt-out-docs.mjs`, `scripts/generate-behavior-docs.mjs`, 19 behavior docs |
| #1089 | `pages/issues.html` — Work done window 24h → 4 weeks |

## NEXT STEP, in order

1. **Commit the 111 files.** The pre-commit gate now includes the collection
   check, so expect it to run.
2. **Wire `document-behavior-classes.mjs` to the census.** The census now records
   real rendered classes (`data/default-gui-census.json`, 149 behaviors, 131 with
   classes). The generator still guesses from source — switch it to read the
   census and emit the `## Classes` table. **This is the half-finished piece.**
3. **`npm run ship`.** Aborted twice tonight, both times on ~3 NEW failures that
   were **different each run** — instability, not regression (#961, open).

## Open questions

- **#961 is not fixed** and its author said so explicitly: 6 tests still change
  state between identical runs. Two ship attempts died on it.
- **#1084** — the ratchet register was recorded on Windows; CI runs Linux. 15
  "new failures" on CI are platform-dependent, not regressions. The register
  cannot be trusted in either direction until it is recorded on the platform the
  gate runs on.
- **#1092** — 87 tests have every `expect()` inside an `if()`. Upper bound; each
  needs reading. Same disease as the collection hole: passes when its subject is
  absent.
- **#1088** — the template ships a 175-file drifted copy of the runtime with 6
  core modules missing. Diverges **both** ways (`card.css` is 112 rules here, 246
  there), so no blind copy.
- **`ratio` schema declares default `16x9`; the code produces `16/9`.** Recorded
  in the description, not yet filed.

## Issues filed tonight

#1076 #1077 #1081 #1082 #1083 #1084 #1085 #1086 #1087 #1088 #1089 #1090 #1091
#1092 #1093 #1094 #1095 #1096

## The pattern worth carrying forward

Every gate I fault-injected caught a real defect (#1076, #1081, #1082, #1090).
Every one I did not was wrong — including three that passed while asserting
nothing, and two false accusations against docs that were fine. **Write the gate,
then break it on purpose.** A green gate that has never been seen red is not
evidence.
