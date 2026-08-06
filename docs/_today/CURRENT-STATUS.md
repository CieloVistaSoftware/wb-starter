# 🅿️ PARKING LOT (2026-08-06 session — comprehensive demo standards fixes)

**Task:** Fixed critical HTML indentation violations, code panel width issues, and added modal spacing compliance testing.

**Completed:**
- **Masonry demo expanded**: 4→8 articles with varying content lengths clearly showing staggered masonry effect
- **HTML indentation standardized**: all article demos follow Standard §5 (one tag per line); masonry articles split across 3 lines (opening tag, content, closing tag); pagination demo multi-attribute tags span lines
- **Table formatting fixed**: 25-row main table reformatted from single-line `<tr><td>data</td>...</tr>` to proper vertical formatting with one `<td>` per line, matching toggle table examples and showing proper HTML structure in code panels
- **Audio code panel width**: increased from default to "wide" (800px max-width) to match proportions of rendered content
- **Modal spacing compliance test**: new regression test validates dialogs have ≥1rem padding, button gaps ≥0.5rem, heading spacing ≥1rem per Standard §13; catches cramped layouts
- **All compliance tests passing**: 8/8 pre-commit checks green, 3 commits, version v3.0.6

**Files touched:**
- `demos/site/content.html` — masonry (77-102), pagination (110-145), audio (162 data-code-width), table rows (213-237 reformatted)
- `tests/regression/modal-spacing-compliance.spec.ts` — new test file, 4 test cases

**Commits:**
1. cfffb14 - masonry + indentation improvements
2. 9e65c81 - table formatting fix
3. e626cef - audio code panel width
4. 3d6fd91 - modal spacing compliance test

**Next step:** Code panels now show proper HTML structure across all demos (masonry, pagination, tables, audio); gap/spacing control system for demos can be implemented as future enhancement

**Open questions:** Gap control system request noted for future work (per-demo gap override, shorthand syntax)

---

# 🅿️ PARKING LOT (2026-08-04 session — pushing to `.io` at John's direct instruction)

**Task:** Worked through John's live feedback (screenshots + text) against the deployed `.io` site and a backlog of open GitHub issues, fixing each with verification (live browser check and/or the relevant regression/compliance test), plus dispatched ~9 parallel background agents for a batch of independent issues per John's explicit "work 10 or 15 issues asynchronously" instruction.

**Landed (about to push to origin/main):**
- `x-password` now auto-infers from `type="password"` alone, matching checkbox/radio/range (#481).
- Fixed a real double-border on styled inputs — a generic wrapper div was reusing input.css's own `.wb-input` class (#485).
- Fixed Components page section-heading spacing — a page-specific rule was silently losing a specificity fight and never applying (#487).
- **wb-notes drawer resurrected and redesigned**: now saves to a real file (`data/notes.json` + `data/note-images/`) via a new `/api/save-image` server endpoint, not just localStorage; supports pasting a screenshot directly into a note; supports picking/attaching a reference to any element on the page; redesigned layout (Save/New in the footer, Close pinned to the header corner, searchable Lookup, 0.5rem header padding, button-sizing fix so labels don't get clipped).
- Fixed `content.html`'s searchable table — the search input was never actually created (#433).
- `cardproduct` images now get the same load-retry/failure handling as image/video cards (#476).
- Systemic fix for the "redundant tag-name class" pattern (`<wb-card>` carrying `class="wb-card"`, etc.) — root-caused to `schema-builder.js`'s generic class-adding path having no guard; fixed there plus card.js/checkbox.js and their CSS (#478).
- "Forced Dark/Light/Cyberpunk Mode" demo cards now render as real styled `<wb-card>`s instead of a bare unstyled div (#430).
- `cardstats` compact/large and `cardproduct` horizontal variants now have real CSS backing them — root cause was a CSS specificity loss against a fallback rule (#479).
- `cardexpandable` gained a `lines` property (CSS line-clamp) as an alternative to pixel `maxHeight` (#435).
- Fixed `wb-copy` reading the wrong attribute name (schema says `text`, code read `copy-text`) and `wb-darkmode`'s click-to-toggle only ever attaching to literal `<button>` tags (#429).
- Restored `pages/behaviors.html` after `scripts/generate-behaviors-page.js` (confirmed stale/unmaintained) silently regressed it back to pre-#304/#390 state when run for an unrelated docs fix — **do not run that script**, it needs a rewrite first (#484, filed).
- Footer now auto-collapses on mobile-landscape scroll, mirroring the header (#393).
- `<wb-demo>`'s default `columns` changed from 3 to 1 (#392).
- `demos/site/cards.html`: mismatched images/avatars and dead/placeholder links fixed across the curated gallery (#403/#404/#407).
- Closed several already-fixed/duplicate issues after live re-verification: #459 (glass card theme-aware), #464 (themecontrol re-init guard), #277 (auto-injection-compliance test), #351 (glass blur fallback), #304/#389 (behaviors.html duplicate of #478's fix).
- `docs/V3-GUIDE.md` §3: split a 6-component crammed `<wb-demo>` into 6 separate ones per standard §2/§17/§18 (#483); added real Overview/Install content to its tabs example.
- `pages/whats-new.html`: added the 2026-08-04 dated section (this session's work, user-facing language).

**⚠️ Known environment issue (recurring — also hit in the 2026-08-03 session, see below):** running multiple background agents in parallel against this same checkout caused at least one stale read-then-full-file-rewrite that silently discarded concurrent edits to `card.js`/`card.css`/`copy.js`/`schema-builder.js` (#478, #479, #435, #429's copy.js half). Caught via a targeted grep-based integrity sweep after the fact and re-applied every lost fix (re-verified against the regression/compliance tests afterward — all green). **If dispatching parallel agents again, do a post-hoc integrity check on any file more than one agent might plausibly touch, don't assume "closed the issue" means the code is still there.**

**🔴 Filed but NOT fixed (deliberately out of scope for the agent/task that found them):**
- **#482** — `wb-cardvideo` has no `aspect-ratio` unlike `wb-cardimage` (inconsistent box height on load failure).
- **#486** — 4 pre-existing `pages/behaviors.html` compliance failures (shrink-to-fit, text padding, 2 absolute-path links).
- **#488** — `variant="glass"` + `elevated` together lose the glass background (specificity conflict), found incidentally while re-verifying #351.
- A cards.html `auto-showcase.mjs` regeneration risk flagged by the #403/404/407 agent (same class of bug as #484 — a generator script that can silently undo hand-fixes) — John started this as its own background task (`task_a64b83db`, "Guard auto-showcase.mjs against clobbering hand-edited demo content") in a separate session; check its outcome next session.

**Still running when this was written (check `gh issue list` / notifications for outcome):**
- #382 — flaky `error-log-empty.spec.ts` under parallel load.
- #322 — `x-behavior` attribute scanning never firing on `wb-lazy.js` pages (doc-viewer/standalone demos) — core-runtime fix, verify carefully before trusting.

**Next step, in order:**
1. Confirm #382 and #322 landed cleanly (re-run their tests; re-check for the parallel-agent file-clobbering pattern above, especially #322 since `wb-lazy.js` is foundational).
2. Run the full `npm run test:compliance` gate — push only if 0 failed (standing rule).
3. Commit, push to `origin/main` (this is what deploys to `.io`).
4. Long-standing carryover from 2026-08-03, still not started: #391 (shrink-to-fit CSS gap, blocks #468/#469), #470 (50 themes), #463 (add-to-cart, needs a design decision from John), #457/#465 (schema architecture debt).
