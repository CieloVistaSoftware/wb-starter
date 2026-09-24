# CURRENT HANDOFF — 2026-09-24

## 🅿️ PARKING LOT

**Task:** fix what kept breaking fundamental elements and the gate. Everything is
on branch `claude/sleepy-lovelace-33wbry`, draft PR #1209, 7 commits.

**State of the repo:** `main` is still 4.0.5 (2026-09-14). Issues filed through
2026-09-23 mention a 4.0.6 release attempt that never reached `main`, so there
is likely unpushed local work. Merge #1209 with that in mind.

**What #1209 does:**

| commit | fix |
|---|---|
| a9bd2c7 | #1206 avatar spec waits for `x-ready` instead of measuring unstyled avatars |
| e0117a9 | #1203 release-bump fixture gets a private `WB_TEST_LOCK_DIR` + 20s limit; guard test holds a live lock |
| 97e326b | first x-checkbox patch (superseded by cef0673) |
| cef0673 | x-checkbox is ONE native `<label><input type="checkbox"></label>`; excluded from schema building |
| 3a7d0b4 | marked.js vendored at `src/lib/marked.js`, no CDN |
| b1b2dd4 | 45 highlight.js themes vendored at `src/styles/code-themes/hljs/`; `codeThemeHref()` builds every theme URL |
| 00ee0b9 | flaky "x-code on a non-code host" spec waits on `x-ready`, not a 400ms sleep |

Guard added: `tests/compliance/no-runtime-cdn.spec.ts` — no CDN URL in `src/` JS,
every code theme has a local stylesheet, vendored marked matches package.json.
Failure baseline: 598 -> 589.

**Files touched:**
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\wb-viewmodels\semantics\checkbox.js`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\styles\behaviors\checkbox.css`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\styles\behaviors\input.css`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\core\mvvm\schema-builder.js`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\wb-viewmodels\mdhtml.js`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\lib\marked.js` (new)
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\wb-viewmodels\codecontrol.js`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\wb-viewmodels\semantics\code.js`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\src\styles\code-themes\hljs\` (new, 45 themes + LICENSE)
- `C:\Users\jwpmi\Downloads\AI\wb-starter\scripts\vendor-code-themes.mjs` (new)
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\compliance\no-runtime-cdn.spec.ts` (new)
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\avatar-shape-and-size.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\release-bump-touches-only-project-version.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\x-checkbox-hidden-input.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\codecontrol-theme-cdn-url.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\code-theme-local-vs-cdn.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\tests\regression\code-theme-control-and-host.spec.ts`
- `C:\Users\jwpmi\Downloads\AI\wb-starter\data\test-baseline-failures.json`

**Last action:** pushed 00ee0b9 (flaky x-code spec fix) and updated the PR body.

**Next step, in order:**
1. Check #1209's CI on 00ee0b9. On green: mark ready, merge.
2. Reconcile with any local unpushed 4.0.6 work. Watch
   `release-bump-touches-only-project-version.spec.ts`: if the local #1128
   `release.mjs` imports `scripts/lib/`, `buildFakeProject()` must copy it too.
3. Run the full commit gate locally (the cloud session could only run targeted
   specs, on the container's Chromium).
4. Close #1206 and #1203 once merged (the PR says Closes).

**Local machine note:** the chip.css / progress.js / schema 503s seen on
2026-09-23 were the dev server going down (`ERR_CONNECTION_REFUSED`); `sw.js`
turns an unreachable, uncached request into a synthetic 503. Restart the
server. The server dying is #1200.

## Open questions

- **Two runtimes on one `window.WB`.** `pages/behaviors.html` imports
  `wb-lazy.js`, which copies its methods onto `window.WB` (wb-lazy.js:1409), so
  `WB.scan()` on that page is the lazy scan and does not wait for anything below
  the fold. Anything awaiting `WB.scan()` there has the same trap the x-code
  spec had. Needs its own issue and a design call.
- **content.html markdown code panel is 34px narrower than its space**
  (doc-viewer-code-panel-audit, already baselined). It was invisible here
  while the CDN outage kept markdown from rendering.
- **"49 themes" spec** (code-theme-control.spec.ts) expects 49; CODE_THEMES
  has 46. Baselined; either the list or the spec is wrong.
- Seen, not chased: `size="sm"`/`"lg"` x-checkbox look like the default; the
  success variant is blue; x-chip `icon="check"` prints the word "check".
- Carried over from 2026-09-11: the page entrance animation's scrollbar flash
  (#1020); card.css variant rules keyed on classes a8a7362e stopped injecting
  (#969 / #914); `maxParallelSingle: 2` port collisions (#1072).
