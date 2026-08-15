# Common Errors Retrospective — week of 2026-08-08 to 2026-08-15

## Method

Pulled every issue closed in the past week (`gh issue list --state closed --search "closed:>=2026-08-08"`) —
**~100 issues**. Categorized by root cause using the actual investigation notes from each fix (not just the
title). This is a pattern analysis, not a component-by-component changelog — see `pages/whats-new.html` for that.

## The 5 recurring patterns, by volume

### 1. Layout/CSS compliance violations — ~21 issues (largest bucket)
#563, #572, #571, #568, #565, #564, #561, #560, #559, #549, #545, #544, #540, #539, #538, #532, #520, #573,
#576, #612, #613

Padding under 1rem, single-item demos not full-width, elements overlapping, code panels wrapping/narrower
than their content, badges clipped by an ancestor's `overflow: hidden`. Almost all of these were caught
*after the fact* by `demo-layout-standards.spec.ts` and friends — the compliance suite is doing its job, but
nothing stops a new violation from being **authored** in the first place. The suite is a safety net, not a
guardrail at write-time.

### 2. Placeholder/dead asset paths — ~9 issues
#610, #605, #601, #551, #548, #529, #526, #519, #514

`/images/feature.jpg`, `"Sample image"`, `"Sample background"`, `music.mp3` — text that reads like a real
path/URL but was never a real, resolvable asset. Every one of these existed for an unknown length of time
with **zero signal** until either a compliance test crawled it or (more often) John spotted it live.

### 3. Compliance-test / process gaps — ~12 issues
#577, #562, #555, #554, #553, #552, #550, #547, #522, #513, #512, #543

The tests themselves had bugs (stale selectors, shared-state pollution across runs), or a class of problem
had no test at all until something broke first. **#543 is the standout**: `!important` usage was already
flagged at 273 instances (more than double the 130 threshold) *before this week started* — and this
session nearly added one more (#614) before being corrected.

### 4. `wb-demo` source-extraction bugs — ~7 issues
#580, #578, #579, #597, #594, #570, #535

One shared mechanism (`page-source-cache.js`'s `getPageSource()`/`extractTagBlock()`, which matches a live
element to "its" source text by counting occurrences) kept breaking on edge cases: `<template>` placeholder
content, HTML comments that merely *mention* a tag name, a code fence nested inside another live element.
Each got patched individually as found — same fragile ordinal-matching design, three different symptoms.

### 5. Attribute-reading gaps — ~7 issues
#603, #602, #608, #567, #575, #528, #521

Either a plain `getAttribute('content')` check was simply missing (copy-paste gap between similar
functions), or camelCase schema property names (`imagePosition`) got authored directly as camelCase HTML
attributes, which HTML parsing lowercases to `imageposition` — never matching a `kebab-case` lookup.
**This exact mistake was made twice by two different authors in two different files in the same week**
(cardhorizontal.md's docs, then the fix itself needed a second pass when `imageposition` — no hyphen — also
failed).

## What actually gets these right vs. wrong

The single biggest predictor of whether a doc/demo shipped broken: **was it ever loaded in a real browser
before being committed?** Every placeholder-path bug, every source-extraction bug, every layout violation
was invisible in the source text — you could read the markdown and see nothing wrong. They were only ever
found by someone (or something) actually rendering the page.

## Concrete changes made from this retrospective

1. **`DEMOS-AND-DOCS-STANDARDS.md` §29 (new)** — codifies "no placeholder asset paths, ever" as a numbered,
   testable rule (pattern #2), not just an ad-hoc convention re-discovered per file.
2. **`DEMOS-AND-DOCS-STANDARDS.md` §30 (new)** — codifies "broken media must throw + log, never fail silently"
   (the fix pattern behind #534/#604/#605/#608), so a *new* card/media component starts with this from day
   one instead of needing its own future issue number.
3. **`DEMOS-AND-DOCS-STANDARDS.md` §31 (new)** — codifies kebab-case-only for HTML attributes (pattern #5),
   with the camelCase mistake documented explicitly since it's now been made twice.
4. **Flagging, not fixing tonight**: the `!important` count (#543, still open) and generalizing
   `extractTagBlock`'s inert-content stripping to have one single, well-tested "strip everything that isn't
   live DOM" helper instead of accreting fixes case-by-case (pattern #4) — both real, both bigger than a
   single-session fix, noted here so they don't get lost.
