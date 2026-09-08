# A gate must be seen to fail

A check that has never been observed failing is not evidence of anything. It may
be enforcing the rule it names. It may be matching nothing at all, and there is
no way to tell those apart from a green run.

This is the most common defect in this repository. Not broken features — broken
*instruments*, which report success while measuring nothing, so the thing they
were meant to catch ships anyway and nobody learns it was ever unguarded.

## The measured record

Every one of these was found in a single session, 2026-09-07. All of them were
green, or silent, or reported success:

| What it claimed | What it did |
|---|---|
| `no-control-characters-in-source` scans source | Scanned `src`, `scripts`, `tests` — not `pages/`, not `.html`. A `0x08` byte in `pages/behaviors.html` disabled #752's warning for a whole release, invisible in every editor and in `git diff` (#1049) |
| `es-modules` forbids CommonJS "anywhere" | Did not scan `tests/`. Two files there used `require()`; one threw on line 1 and had validated nothing for months |
| `generate-custom-elements.js` regenerates the manifest | Emitted `✅ Generated 0 component definitions`, exit 0, and overwrote a 55KB manifest with 76 bytes. Dead since 4.0.0 (#1057) |
| `validate-vscode-data.js` validates IntelliSense data | CommonJS in an ESM package: `ReferenceError` on line 1. Checked nothing, ever |
| `doc-viewer-code-panel-audit` check (a) finds cramped panels | Failed on the horizontal scrollbar §28 *requires*, and was unsatisfiable beside its own check (c). 8 false failures hid 2 real ones (#1060) |
| 28 `fix-viewer` tests assert the viewer's UI | Waited 30s for a `.fix-card` the page stopped rendering when #912 replaced it with a table. Failed as timeouts, read as flakiness (#1061) |
| `loadSchemaIndex()` applies declared attributes | 404'd on every page under `public/`, `pages/`, `demos/`. Treated as "not arrived yet, the next scan will apply it" — permanently (#1059) |
| 57 signature `detect:` commands find instances | None had ever been run. 18 do not execute at all |
| `WBDemo.connectedCallback` captures authored source | Nothing registers the class. It has never run, and live comments in `wb.js` describe racing it (#1063) |

Nine instruments. One session. None of them announced anything.

## The rule

**Before trusting a gate, watch it fail on the defect it exists to catch.**

Not "review it carefully". Not "it looks right". Run it against a tree that
contains the fault and see it go red, then fix the fault and see it go green.
Both directions, or you have not tested the test.

#1049 wrote this into its own acceptance criterion and it was the correct call:

> "The widened guard must FAIL on the current tree before the byte is removed —
> demonstrated, not assumed. A guard that has never been seen to fail is not
> evidence of anything."

Doing that took one extra run and immediately found two more control characters
in directories the old guard already covered.

## What this rules out

**Green on the first try is not a result.** A test written after a fix, run once,
passing, has demonstrated nothing. Revert the fix — or run it against a clean
checkout — and confirm it fails. Two tests written on 2026-09-07 passed
identically with and without the fix; both were rewritten once that was checked.

**Silence is not success.** A detector that prints nothing has either found
nothing or has not run. `scripts/backfill-signature-evidence.mjs` treats empty
output as a failure for this reason: its first version recorded blank evidence
for a detector that prints 39 lines, because `execSync` on Windows defaults to
`cmd.exe` and truncates a multi-line command at the first newline — exit 0, no
output, indistinguishable from a clean result.

**An assertion that cannot fail is worse than none.** Written the same day:
`expect(distinct404s.length).toBe(new Set(schema404s).size)` — the same value on
both sides. It reads like rigour and can never be red.

**A vacuous pass is a failure to report.** If the subject set is empty, say so
and fail. Every sweep here now asserts its own derivation is non-empty first,
because `no-data-attributes` sat `.skip`ped for months over "453 assertions,
all passing, none of them running", and a sub-path gate hand-listed nine
behaviours and passed while the site 404'd on a tenth.

**Do not weaken a gate to make it green.** #1060's check was wrong and was
corrected to measure the panel against its container — that is not the same as
relaxing it. The corrected check still fails on 2 real defects. If a correction
takes the failures to zero, be suspicious of the correction.

## The habit underneath

Inference is not measurement. In one session, three confident diagnoses were
wrong — a box-model comparison, an `/api/fixes` mismatch, and a
`connectedCallback` race described in detail before anyone checked that the class
was registered. Each was plausible, each was written down as if established, and
each cost a round trip that one command would have saved.

2026-09-08 added a fourth, and it is the sharpest of them because it was a
measurement that expired. A suite run was launched after verifying the machine
was quiet — no listener on the port, no Playwright processes, no lock — and its
result was then reported as "a clean run with nothing else touching the machine."
Two hundred and twenty-eight failures, 120 of them "could not connect to server."
An issue was filed on the strength of that (#1074) claiming the server dies on
its own. It does not: a second session was running its own suites in the same
tree the whole time, and both runs had landed on the same fixed fallback port
(#1072). The check was real. The claim outlived it by half an hour.

**A precondition verified once is not a precondition that held.** If a run's
validity depends on the machine being quiet, check at the end too, or record
something during the run that would show if it stopped being true.

The `evidence:` field in [ISSUE-SIGNATURE-BLOCK.md](./ISSUE-SIGNATURE-BLOCK.md)
exists for the same reason: a `detect:` nobody ran is a guess with syntax
highlighting. #1055 was filed claiming one orphan document on a derivation that
was simply wrong; the real number was 48, and 35 of those were not orphans at all.

Run it. Paste what it printed. Date it.
