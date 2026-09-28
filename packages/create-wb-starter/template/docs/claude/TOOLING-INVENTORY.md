# Tooling Inventory — What This Repo Already Has

**Read this before writing any new tooling.** Every entry here was already
built, and at least three of them have been reinvented by someone who didn't
know they existed.

The reinvention is not a style problem. A second mechanism measuring the same
thing drifts from the first, and then the two disagree with nobody noticing —
which is exactly how `#923` ended up with five copies of one rule and `#951`
with a duplicated label rule that lost a branch.

---

## Machine-readable test output

Produced by `scripts/tools/test-reporter.ts`, installed as a reporter in
`playwright.config.ts`. It runs on **every** Playwright invocation — you never
need to add `--reporter=json`.

| file | what it holds |
|---|---|
| `data/test-results/failures.json` | every failure: `{project, title, file, line, error}` — **this is the one you want** |
| `data/test-results/<project>.json` | per-project detail |
| `data/test-status.json` | live status while a run is in flight: `state`, `passed`, `failed`, `currentFile`, `failures[]` |
| `data/test-results/failures-live.log` | human-readable running log |

> Do **not** add Playwright's own `json` reporter to get at failures. It was
> tried; `PLAYWRIGHT_JSON_OUTPUT_NAME` produced nothing and the gate reported
> "the suite never ran" for a run that had never been launched. The reporter
> above already writes what you need, and using it keeps the ratchet and the
> rest of the tooling agreeing on what a failure *is*.

## Running tests

- `npm_test_async` MCP tool → launches asynchronously; poll `data/test-status.json`.
  **Law 4: never run Playwright synchronously.** One suite run at a time,
  machine-wide.
- Single spec: pass a filter, e.g. `npm_test_async { filter: "sticky" }`.
  The filter is a path regex — `|` will be eaten by the shell, so run one at a time.

## Gates, and the baselines they ratchet against

All three are **ratchets**: they fail on *new* problems, never on the mere
existence of old ones. A gate too strict to pass gets bypassed, and the
`--no-verify` habit takes every other check down with it (`#840`).

| gate | script | baseline | fails when |
|---|---|---|---|
| Lint | `.husky/lint-ratchet.mjs` | `.husky/lint-baseline.json` | a file you touched has *more* problems than recorded |
| Tests | `.husky/test-ratchet.mjs` | `data/test-baseline-failures.json` | a failure appears that is **not** in the register |
| `wb-` prefix | `scripts/audit-wb-prefix.mjs` | ceilings in `tests/compliance/wb-prefix-cannot-return.spec.ts` | a category grows past its ceiling |

Baselines **only ever shrink**. A repaired test is removed automatically so it
can never rot again. Never raise a ceiling to make a build pass — that is the
moment the gate stops meaning anything.

The pre-commit hook runs lint on **every** commit and the test ratchet on every
**10th** (counter at `.git/wb-fix-count`).

## Reading attributes in a behavior

`src/core/read-attr.js` — use these, do not hand-roll a `??` chain:

- `readAttr(el, name, fallback = '')` — string. **Returns `''`, not `null`,
  when absent**, so `readAttr(...) ?? 'default'` is dead code. This caused #946.
- `readNumber(el, name, fallback = 0)` — number, never `NaN`.
- `readFlag(el, name)` — boolean.

## Audits and one-off analysis

Check `scripts/` before writing a new analysis script — there are ~100 of them.
Notable: `audit-wb-prefix.mjs`, `audit-inline-styles`, `run-regression-tests.js`.

---

## The rule this file exists to serve

Before building tooling, spend thirty seconds:

```bash
ls scripts/ | grep -i <thing>
grep -rn "<the output file you're about to invent>" --include=*.ts --include=*.mjs .
```

The repo usually already has it.
