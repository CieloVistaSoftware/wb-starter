# 🅿️ PARKING LOT (2026-08-03 session — stopped for the day by direct instruction "i want to quit soon")

**Task:** Continued a large backlog of John's live bug reports (screenshots + text) against the deployed `.io` site, root-causing and fixing each with a regression test, plus dispatched several parallel background agents for larger, independent pieces of work per John's explicit "run parallel jobs" instruction.

**Landed & pushed (origin/main, through commit `e086dda`):**
- Fixed `docs/manifest.json` 404 on the root SPA (`siteRoot()` in `demo.js` didn't handle `/index.html`) — was silently killing every component's "Docs:" link there.
- Fixed `WB.scan(root)` never processing `root` itself (only descendants) — was silently breaking syntax highlighting/line-numbers/copy-button on every dynamically-injected code panel site-wide (the root cause behind `demos/frameworks.html`'s clipped code text).
- Removed a legacy, duplicate code-highlighting system on `demos/frameworks.html`; Svelte and SolidJS framework demos now genuinely compile and render live in the browser (verified via real interactive clicks); Angular confirmed and documented as genuinely not achievable without a real build step.
- 45-component redundant-tag-name-class sweep (issue #448) — complete, all components fixed.
- Site-wide click-confirmation toast (`src/core/click-confirm.js`, issue #456) on every button/card/switch, with dedup logic (capture-phase + defer) so components that already show their own toast (cardbutton, cardproduct, etc.) don't double up.
- `wb-themecontrol` gained a re-init guard — was duplicating into two out-of-sync dropdowns after repeated scan/observe passes over a long session.
- New compliance gate: no native tag (`<form>`, `<fieldset>`) may carry a redundant `x-<sametag>` attribute — 3 real instances found and fixed.
- `demos/site/cards.html`: theme picker added, placeholder links/identity replaced with real ones (issue #404 follow-through).
- `tests/fixtures/cards-permutation-matrix.html`: doc-links fixed (same `siteRoot()` class of bug, extended to `tests/fixtures/`), glass-card CSS now theme-aware (was invisible on light themes).
- `wb-cardprofile` role badge now genuinely vertically centered (a repeat report — the earlier #406 "fix" used a fixed offset that stopped working once the cover strip grew taller).
- `wb-cardhorizontal`: fixed a real bug where plain inner text content was silently discarded (never captured as a fallback before being wiped) — issue #455.
- Mobile page padding fixed across 11 files (was eating up to 38% of small phone screens).
- `index.html` real title/description + og/twitter meta tags (was showing generic placeholder text).
- Large "no OOP language" sweep across docs (issue #462/#465-adjacent) — "Base Card" → "Card", plus 12 more doc files reworded from inheritance framing to composition framing.
- `pages/whats-new.html` — added the 2026-08-03 dated section.

**🔴 NOT yet done / explicitly deferred (John's own words, or scope too large to safely start before wrap-up):**
- **#468** — V3-GUIDE.md's Quick Start `wb-card` example reads "too stubby" — needs test-first investigation, likely overlaps the still-unsolved #391 shrink-to-fit CSS gap (grid `1fr` tracks + container-query components). Don't reattempt blind — #391 documents a `max-content` attempt that collapsed a different card to a 2px sliver.
- **#469** — `docs/components/cards/card.md` cards must follow layout standards — same test-first ask, same likely overlap with #391.
- **#470** — increase theme count from 23 to 50. Large content-creation task, not started.
- **#466** — End key doesn't scroll to the true bottom of `public/doc-viewer.html` pages (stops short, confirmed via real keypress not synthetic). Root cause not yet found — worth checking whether late-loading content shifts `scrollHeight` after the browser's own key-scroll calculation runs.
- **#463** — "support add to cart clicks" (wb-cardproduct) — deliberately filed as a scoping question, not started. Needs a decision on where cart state lives and what UI surfaces it before any code.
- **#457, #465** — noticed incidentally by background agents, filed, deliberately left alone (out of scope for the task that found them): `.wb-card--minimal` has no real CSS anywhere except scoped to testimonial cards; `cardprofile.schema.json`/`card.schema.json` have real `$extends`/IS-A/HAS-A schema metadata (16 files) that's the live source of stale IntelliSense tooltip language — bigger, riskier, real schema architecture work.
- **391** (long-standing) — Standard §7 shrink-to-fit still imprecise for some real cards. Directly blocks #468/#469 above.

**Environment note for next session:** multiple background agents this session shared the SAME dev server/browser-pane instance as the main session (not fully isolated despite separate git worktrees), causing real cross-talk — stray port-3000 processes needing to be killed/restarted at least 4 times, and agents temporarily writing-then-reverting files in the shared checkout mid-verification (confirmed by their own reports). If this recurs, check for a stray `node server.js` process bound to the main checkout before assuming a real server bug.

**Next step, in order:**
1. #391 first — it's the blocker for both #468 and #469. Needs careful root-cause work on the shrink-to-fit CSS (grid `1fr` + container-query interaction), not another guess.
2. Then #468/#469 (test-first, as explicitly requested).
3. #466 (End key) — moderate-difficulty investigation, self-contained.
4. #470 (50 themes) — large but mechanical once started, good candidate for a dedicated session.
5. #463 (add-to-cart) — needs a design decision from John before any code.
