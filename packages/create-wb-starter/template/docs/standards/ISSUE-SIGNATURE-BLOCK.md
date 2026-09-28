# The Signature Block

Every issue carries one. It is the machine-readable half of what the prose
already says, and it is what makes a solved problem reusable.

## Why

John, 2026-09-03:

> "All of our issues contain signatures which should be fixed and the tests
> logged. But if we want to make a fix based on that information how would we
> do it? The answer is a form which externalises the signature and the fix that
> was made, then anything in the fix queue would simply match the existing
> signature to what we have already solved."

Without a fixed shape, the signature is still *there* — it is written into the
prose — but nothing can read it. An extractor built on error-string patterns
(`TypeError`, `expect(`, `404`, `px`) scored the issues at 51% and reported
#1005 as evidence-free, when #1005 states its signature four separate times.
That measured the regexes, not the issues.

The block removes the guessing. The author writes down what they already know.

## The shape

````markdown
## Signature

```yaml
kind: structural
subject: dialog / authored <dialog> path
observed: "<h2> + <p> only — no .x-dialog__header, no .x-dialog__body"
expected: "header.x-dialog__header + main.x-dialog__body"
detect: |
  grep -rn "showClose" src/     # must be non-empty; empty means declared-and-inert
test: tests/regression/dialog-samples-have-close-and-padding.spec.ts
fix: "enhance authored <dialog> in place — move heading/children into header+body"
```
````

## Fields

| field | required | meaning |
|---|---|---|
| `kind` | yes | which class of signature — see below |
| `subject` | yes | the behavior, file, page or script it concerns |
| `observed` | yes | the wrong thing, verbatim where it can be quoted |
| `expected` | yes | what it should be instead |
| `detect` | when computable | a runnable command or predicate that finds instances |
| `evidence` | whenever `detect` is present | what `detect` actually printed, and the date it printed it |
| `related` | when a family exists | sibling issue numbers with the same root cause |
| `test` | on close | the validating test — the thing that makes it *verified* not *claimed* |
| `fix` | on close | what actually fixed it, in one line |

### Never a field

| field | why not |
|---|---|
| `status` | derived by `scripts/issue-state.mjs`, never asserted |
| `state` | same — the engine writes it, the block does not |
| `shipped` | same |
| `released` | same |
| `commit` | git already knows which commits cite an issue |

**This table and the two above are the definition, not a description of one.**
`scripts/lib/signature-schema.mjs` parses them out of this file at runtime, so
the validator, the backfiller and anything else read the same rows you are
reading. Adding a field here adds it everywhere; there is no second list in a
`.mjs` to keep in step, because a second list is a second thing that can be
wrong — the same reason `status` is not a field.

### The two fields added 2026-09-07, and the failure each one answers

The issue is the only place truth lives. Both fields below exist because
something outside the issue tried to hold that truth and got it wrong.

A third was drafted and **deliberately rejected**, which is worth recording
because it is the trap this whole standard exists to avoid. `pages/whats-new.html`
had claimed, in a hand-written heading, that three changes were *"on `main`"* when
two of them were uncommitted in a working tree — so the obvious repair looked like
adding a `commit:` field naming the SHAs. It is the wrong repair. Git already
knows which commits cite an issue, and `scripts/issue-state.mjs` already derives
`committed` / `pushed` from reachability off the remote default branch (#1043). A
hand-written `commit:` would be a second copy of something already computable, and
a second copy is a second thing that can be wrong — which is precisely how the page
got it wrong in the first place. **Ship state is never a field. It is derived, and
the engine is where it is derived.** The page's bug is that it does not read the
engine, and no amount of new signature fields fixes that.

So the rule the failure actually produced is a prohibition, not a field: nothing
outside the issue may assert where a fix lives.

**`evidence` — because a `detect` can be confidently wrong.**
#1055 was filed claiming one orphan doc, with a `detect` block that looked
reasonable and was junk: it compared docs against `src/wb-viewmodels/` filenames,
which is not how behaviours are registered. The real number was 48, and 35 of
those were not orphans at all. Nothing forced the filer to paste what the
command actually *printed*, so a broken derivation read as a finding.

Recording the output turns `detect` from an intention into a measurement, and a
dated one — a detector that found 5 instances in March and 0 today is telling you
something either way.

**`related` — because the same defect keeps arriving under new numbers.**
"An asset path resolves against the wrong base" has now been filed four times
wearing four different faces: #1047 (the showcase catalogue), #1053 (the doc
viewer's `/public/` base), #1055 (misdiagnosed), #1056 (a page reading one of two
registries). Each was investigated from scratch. In prose the links are invisible
to tooling; as a field, the family is queryable, and the fourth instance can be
recognised as the fourth rather than the first.

### `kind`

| kind | matches on | example |
|---|---|---|
| `runtime` | a thrown error's normalised message | `SyntaxError: missing catch or finally` (#988) |
| `test-failure` | expected vs received | `toHaveClass /x-card/, received ""` |
| `measured` | a number against a documented threshold | 2.2px padding vs §13's 1rem (#1006) |
| `structural` | DOM/config shape that is wrong | authored `<dialog>` with no header (#1005) |
| `dead-declaration` | declared somewhere, read nowhere | `dialog.showClose` (#1005) |
| `process` | a workflow gap, not a code defect | no post-deploy smoke test (#990) |

## `detect` is the part that matters

`detect` is why this is not paperwork. A signature with a runnable `detect`
turns one solved problem into a permanent detector that finds instances nobody
has reported.

Two written from problems solved by hand this week, and what they found on
first run:

```
#999  — behavior stylesheet not in behavior-css-manifest.js never loads
        58 css files, 53 listed -> 5 ORPHANS shipping dead:
        layout.css, modal.css, release.css, stock.css, ui-utils.css

#1005 — schema attribute declared and read nowhere
        156 schemas -> 43 DEAD DECLARATIONS, including drawer.showClose,
        drawer.closeOnBackdrop and drawer.closeOnEscape — the identical trio
        to dialog's, never reported by anyone
```

One issue was filed by hand for each of those signatures. The detectors found
47 more instances in one pass.

## The three tiers of reuse

1. **Computable `detect` → auto-fixable.** "Missing from the manifest" has
   exactly one correct fix: add the entry. Detect, fix, run `test`, log it.
2. **Signature match → assisted.** Same signature in different code: the stored
   cause and test transfer, the diff usually does not. Propose, apply in
   context, let `test` be the gate.
3. **No match → new.** Solve it, write the `detect`, and the registry gains a
   permanent guard.

## Rules

- Every new issue gets a Signature block at filing time. `kind`, `subject`,
  `observed` and `expected` are required then.
- `detect` is required whenever the condition is computable. Most `structural`
  and every `dead-declaration` signature is.
- `evidence` is required whenever `detect` is present: paste what it printed and
  date it. A `detect` nobody ran is a guess with syntax highlighting.
- Ship state is **never written down**, in the block or anywhere else. Cite the
  issue number in the commit message and let `scripts/issue-state.mjs` derive
  `committed` / `pushed` from git. No page, doc, changelog, release note or
  comment may assert where a fix lives; they read the engine or say nothing.
- `related` names sibling issues sharing a root cause, so the fourth instance of
  a defect can be seen as the fourth.
- `test` and `fix` are filled when the issue is closed. An issue closed without
  `test` is closed as *claimed*, not *verified*.
- The block is the source the fix registry reads. Keep it accurate over
  keeping it tidy.

## Validator

```bash
node scripts/check-issue-signatures.mjs           # open issues missing a block
node scripts/check-issue-signatures.mjs --closed  # closed issues missing test/fix
```
