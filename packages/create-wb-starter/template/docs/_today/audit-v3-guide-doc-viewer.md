# Audit: `docs/V3-GUIDE.md` on `/public/doc-viewer.html`

**Date:** 2026-08-09
**Trigger:** live report — "this page has plenty of errors with layout"
**Scope:** `localhost:3000/public/doc-viewer.html?file=docs%2FV3-GUIDE.md`, plus the
mdhtml.js auto-live-render feature this page exercises for the first time site-wide.

## What was found

### 1. Full-document boilerplate example live-rendered its own `<link>` tags → 404s
**Where:** `docs/V3-GUIDE.md:74-100` — a "here's how to wire up your own `index.html`"
illustration (`<!DOCTYPE html><html><head><link href="src/styles/themes.css">...`)
that happens to contain a real `<wb-card>` tag nested inside.

**Cause:** the newly-shipped auto-live-render conversion (mdhtml.js) matched the block
because it contains a `<wb-*>` tag, and wrapped the *entire* boilerplate — `<link>` tags
included — in a live `<wb-demo>`. Browsers parse and fetch `<link href>` regardless of
how oddly it's nested, so `src/styles/themes.css` and `src/styles/site.css` were
requested as real page resources, resolving (wrongly) against doc-viewer.html's own
location: `/public/src/styles/themes.css` / `/public/src/styles/site.css`, both 404.

**Fix:** a fenced block containing `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` is a
whole-file illustration, not a live-renderable snippet — excluded from conversion
regardless of what's nested inside it. (`src/wb-viewmodels/mdhtml.js`)

**Test:** `tests/regression/doc-viewer-boilerplate-example-no-live-render.spec.ts`
(2 cases — no 404s/errors on page load; the boilerplate's `<link>` never becomes a
real request)

### 2. Bare small-control examples (Spinner, Progress) collapsed to unreadable vertical strips
**Where:** `docs/V3-GUIDE.md`'s `<wb-spinner></wb-spinner>` and `<wb-progress value="75"
striped></wb-progress>` examples — no size-driving content of their own.

**Cause:** the single-item shrink-to-fit rule (`#486`,
`wb-demo:has(> .wb-demo__grid--cols-1 > :only-child)`) sizes the *whole* demo — code
panel included, since `.wb-demo__code` is `width:100%` of its `wb-demo` parent — to the
control's own measured width. Correct for a normal-sized control, but a spinner/progress
bar with no explicit dimensions measured 36-68px live, dragging the code panel down to
that same width and wrapping the source text one **character per line**.

**Fix:** `.wb-demo__code` (and its `wb-demo` parent, so a child's min-width isn't just
clipped by an ancestor with a smaller explicit `width`) get a `min-width: min(320px,
90vw)` floor by default — narrow enough to never overflow a genuinely narrow mobile
viewport, wide enough that source code is always legible regardless of how small the
control itself is. (`src/styles/behaviors/demo.css`)

**Follow-up bug found while fixing this:** the new default floor's selector
(`:has()` + descendant class) outranks the existing `wb-demo[data-code-width="50vw"]`
opt-in on CSS specificity — a hardcoded `min-width: 50vw` there was silently losing to
the new `min-width: min(320px, 90vw)` default regardless of which pixel value was
actually larger (CSS picks the higher-specificity rule outright; it doesn't take the max
of two competing `min-width` declarations). Fixed by routing both through a shared
`--demo-code-min-width` custom property instead of two competing hardcoded values, so
there's only ever one rule that wins the property.

**Test:** `tests/regression/v3-guide-code-panel-min-width.spec.ts` (2 cases — no wb-demo
on the page renders under the readable floor; the Spinner example specifically shows
real wrapped text, not character-per-line) + `tests/regression/code-panel-50vw-min-width.spec.ts`
(re-verified/fixed a stale selector left over from the anchor-id rename earlier this
session — was pointing at `#component-card`, now `#cardComponentDemo`)

### 3. Site-wide spot-check (61 files use the new auto-live-render feature)
Ran a full sweep of every `docs/components/**/*.md` file containing a ```` ```html ````
example (61 files) through doc-viewer.html, checking for 404s and uncaught errors.
**49 passed clean.** 12 failed, in three distinct categories — **not new bugs in the
conversion logic itself**, pre-existing content using placeholder/example paths that
were previously inert text and are now live enough to actually attempt a fetch:

| Category | Files | What 404s |
|---|---|---|
| Placeholder image paths in card examples | `cardhero.md`, `cardhorizontal.md`, `cardoverlay.md`, `cardportfolio.md`, `cardproduct.md`, `cardprofile.md`, `cardtestimonial.md`, `cardvideo.md` (8 files) | `images/hero-bg.jpg`, `images/john.jpg`, etc. — illustrative filenames that were never real files |
| Placeholder media paths, semantic components | `semantics/img.md`, `semantics/video.md` | `photo.jpg`, `thumbnail.jpg`, plus `src/wb-models/video.schema.json` (this one may be a genuinely missing schema file, not just a placeholder path — worth its own look) |
| Nested `<wb-mdhtml>` recursion | `mdhtml.md` | `<wb-mdhtml src="/docs/guide.md">` — the doc's own example of the markdown-renderer, live-rendering ANOTHER (fake) markdown file; on that fetch's 404, mdhtml's error path appears to cascade into fetching several site-shell assets (`wb.js`, `site-engine.js`, `themes.css`, etc.) that also don't resolve correctly from this context |

None of these produce broken *layout* (browsers/wb components handle a missing image
gracefully) — they're console/network noise, not the character-wrapping or fetch-storm
severity of findings #1-2. Filed as follow-up issues rather than fixed inline here, since
fixing them means either replacing placeholder paths with real demo assets (content
work, not a code bug) or auditing `wb-mdhtml`'s own nested-fetch error handling (a
separate, deeper investigation).

## Fixes shipped this session (commits, most recent first)
- `edb96d9` — doc examples auto-render as live `wb-demo` widgets (the feature itself)
- *(pending commit)* — full-document boilerplate exclusion (#1 above)
- *(pending commit)* — code-panel min-width floor + specificity fix (#2 above)

## Regression tests added
- `tests/regression/doc-viewer-boilerplate-example-no-live-render.spec.ts`
- `tests/regression/v3-guide-code-panel-min-width.spec.ts`
- `tests/regression/doc-viewer-auto-demo-shrink-width.spec.ts` (from the earlier
  audio.md equalizer finding, same session)
- `tests/regression/doc-viewer-auto-demo-spotcheck.spec.ts` (5-file representative
  sample across cards/forms/feedback/layout)
- `tests/regression/code-panel-50vw-min-width.spec.ts` — fixed a stale selector
  (`#component-card` → `#cardComponentDemo`) left over from the components.html
  anchor-id rename earlier this session; would have silently stopped testing anything
  if not caught here

## Open follow-ups (not fixed, filed separately)
- 8 card-family docs + 2 media docs reference placeholder image/video paths that now
  actually 404 (harmless but noisy)
- `src/wb-models/video.schema.json` may not exist — worth confirming independently of
  the placeholder-path issue
- `mdhtml.md`'s nested `<wb-mdhtml>` example cascades into ~7 additional 404s on fetch
  failure — `wb-mdhtml`'s own error-handling path needs its own investigation
