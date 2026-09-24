# CURRENT HANDOFF — 2026-09-24

## 🅿️ PARKING LOT

**Task:** get `main` out of the 4-week broken state. Everything is on branch
`claude/sleepy-lovelace-33wbry`, PR #1209. **CI is green** (all 8 checks,
Playwright ratchet: 0 new failures, 152 repaired since baseline). It is ready
for John to merge -- a merge to `main` is a release, so John presses the button.

**State of the repo:** `main` is still 4.0.5 (2026-09-14). Issues filed through
2026-09-23 mention a 4.0.6 release attempt that never reached `main`, so there
is likely unpushed local work. Merge #1209 with that in mind.

**What #1209 does:**

| commit | fix |
|---|---|
| a9bd2c7 | #1206 avatar spec waits for `x-ready` instead of measuring unstyled avatars |
| e0117a9 | #1203 release-bump fixture gets a private `WB_TEST_LOCK_DIR` + 20s limit |
| cef0673 | x-checkbox is ONE native `<label><input type="checkbox"></label>` (97e326b superseded) |
| 3a7d0b4 | marked.js vendored at `src/lib/marked.js`, no CDN |
| b1b2dd4 | 45 highlight.js themes vendored; `codeThemeHref()` builds every theme URL |
| 00ee0b9 | x-code non-code-host spec waits on `x-ready` |
| d8541de | tooltip spec hovers until the button's own tooltip opens |
| bce693e | forced #1078 spec stops starving the runtime it verifies |
| 4404db8 | CI wires `core.hooksPath .husky` |
| 7732478 | CI gets the read-only `GH_TOKEN` so `gh` works (issues:read, pull-requests:read) |
| 1708fdb2 | html-validity `[x-demo]` spec waits for the panels to finish rendering |
| (last) | `playwright.config.ts`: `captureGitInfo: { diff: false }` -- see below |

**The CI history mystery, solved.** `unshipped-work-is-not-called-pushed`
saw 16 commits on every PR run. Playwright's built-in gitCommitInfo plugin, on a
GitHub Actions `pull_request` run, runs `git fetch origin <PR base sha>
--depth=1` to record a diff for report metadata; in a full clone that writes
`.git/shallow` and hides all history behind main's tip. Proven in CI (a
watcher caught `.git/shallow` + `FETCH_HEAD` naming the base SHA 1.5s into the
gate) and locally (faked PR env: 1132 -> 18 commits; with the fix, 1132 stays).
The spec also restores history itself if anything shallows the clone again.

**Next step, in order:**
1. John: merge #1209 (closes #1206, #1203).
2. Reconcile with any local unpushed 4.0.6 work. Watch
   `release-bump-touches-only-project-version.spec.ts`: if the local #1128
   `release.mjs` imports `scripts/lib/`, `buildFakeProject()` must copy it too.
3. Ratchet the baseline down: 152 tests repaired since it was recorded
   (`node .husky/test-ratchet.mjs --update` on a clean full run).

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
