# Common Header Specification (wb-common-header) ✅

**Purpose:** Create a single, shared header used by both the Home and Builder pages so the Issues button and header behavior are identical and reusable.

---

## Summary
- Component name: `wb-common-header` (or extend `wb-header` with `wbHeader.common` API)
- Visible on: **Home** (site shell) and **Builder** (top-bar) pages
- Primary feature: unified **Issues** button that opens the `wb-issues` modal to submit issues to `/api/add-issue` (saved to `data/issues.json`)

---

## Requirements
- Header includes: brand, nav links (existing), theme control (if configured), and an **Issues** button (🐛).
- Clicking Issues opens a modal for logging an issue with: **Description (required)**, **Type (bug/feature/improvement)** (default: **bug**), **Priority** (default: **2**), the **current URL** (auto-filled), a **Save** button and a **Close (✕)**.
- Modal behavior: keyboard accessible, Esc closes, focus trap while open, success message on save, and after save it resets form and closes (per `wb-issues` behavior).
- Reuse `wb-issues` behavior where possible (it already provides WebSocket and pending-issues list functionality).

---

## Data & Server Integration
- Use existing server endpoint: `POST /api/add-issue` with `{ content }`. Server appends to `data/issues.json` and triggers parsing.
- Modal should construct a `content` string similar to existing `wb-issues` behavior (type, priority, page, description, steps).

---

## Implementation Plan (Phased)
1. Remove old scattered Issues triggers (safe deletion) to avoid duplicates.
2. Implement `wb-common-header` behavior (new file `src/wb-viewmodels/common-header.js`) with a public API `openIssues()`.
3. Add the Issues button into the common header markup & styling (`src/styles/components/common-header.css` or extend `header.css`).
4. Wire Home header: update `src/core/site-engine.js` to include `wb-common-header` or use `wb-header` extension.
5. Wire Builder header: replace content in `src/builder/views/top-bar.html` with the common header (or embed the Issues button that calls the same API). Ensure identical UX and styling.
6. Tests: Playwright tests that clicking Issues on Home and Builder opens the modal, saving writes to `data/issues.json` and UI behaviors work (close X, ESC, success state).

---

## Decisions (latest)
- We will **use `wb-navbar`** as the base for the common header to preserve site look-and-feel and existing accessibility behaviors.
- We will **merge the Builder top-bar into the common header** rather than maintaining two separate headers. This ensures identical behavior when placing/running components on Home and Builder.
- We will **reuse `wb-issues`** for the issue modal (it already implements Save, Close X, ESC handling, WebSocket updates, and posts to `/api/add-issue`).

---

## Merge Top-Bar Plan
- Goal: Replace `src/builder/views/top-bar.html` with a `wb-navbar` instance or integrate `wb-navbar`-style markup so the Builder header matches Home.
- Steps:
  1. Update `src/builder/views/top-bar.html` to use the same `wb-navbar` extras markup as `src/core/site-engine.js` (include the Issues button and any builder-specific controls such as Save/Preview).
  2. Remove any duplicate Issue triggers and bindings (`headerIssuesBtn` in `top-bar.html` and `toggleBuilderIssues` bindings in `src/wb-viewmodels/builder-app/index.js`).
  3. Ensure `wb-issues#siteIssuesDrawer` is created lazily and exposed by a shared helper fn `openSiteIssues()` used by both Home and Builder.
  4. Add small style adjustments for builder-specific button placement (if needed) in `src/styles/builder.css` or a shared `common-header.css`.

---

## PR Strategy & Checklist
- PR 1 — Cleanup: remove old issue buttons and bindings
  - Files touched: `src/builder/views/top-bar.html`, `src/wb-viewmodels/builder-app/index.js`, `src/core/site-engine.js` (if necessary)
  - Tests: none (sanity checks needed).
- PR 2 — Common Header Implementation: add `wb-common-header` / or adapt `wb-navbar` usage; add helper `openSiteIssues()` and centralize issue open logic
  - Files touched: `src/wb-viewmodels/common-header.js`, `src/styles/components/common-header.css` (optional), small helper in `src/core/site-engine.js` or a new module `src/lib/issues-helper.js`.
  - Tests: unit smoke tests, Playwright tests for opening issues.
- PR 3 — Merge Builder Top Bar: replace top-bar markup and wire same API
  - Files touched: `src/builder/views/top-bar.html`, tests update
  - Tests: Playwright tests ensuring Builder opens same modal and saves to `data/issues.json`.
- PR 4 — Final polish + docs and tests
  - Update `docs/COMMONHEADER.md`, add tests `tests/behaviors/ui/issues-header.spec.ts`, ensure CI passes.

Checklist to merge each PR:
- [ ] Code compiles and lint passes
- [ ] Playwright tests for header & issues pass locally
- [ ] Manual smoke test: click Issues on Home and Builder → modal opens, Save writes to `data/issues.json` (verify file)
- [ ] Documentation updated (`docs/COMMONHEADER.md`)

---

## Tests to add (detailed)
- `tests/behaviors/ui/issues-header.spec.ts`:
  - Test 1: Home header Issues button opens `wb-issues` modal and modal elements exist (Description textarea, Save button, Close X). Submitting results in 200 and `data/issues.json` contains new entry.
  - Test 2: Builder top bar Issues button opens the same modal and has identical behavior.
  - Test 3: Close X and ESC close modal and focus returns to trigger.

---

## Next steps (immediate)
- I will open PR 1 (cleanup) and show the small patch for review. After your review and approval, I will continue to PR 2 (implement header) and PR 3 (merge top-bar).

If you want any changes to this plan or additional details added to `docs/COMMONHEADER.md`, tell me which section to edit.
---

## Acceptance Criteria
- Both pages show an identical header with an Issues button.
- Clicking Issues opens a modal to log an issue with Save and Close actions.
- Submitting the modal results in a new entry in `data/issues.json` via `/api/add-issue`.
- Modal is keyboard accessible; pressing Esc closes it.

---

## Files to Create / Modify
- Create: `src/wb-viewmodels/common-header.js` (implementation)
- Create: `src/styles/components/common-header.css` (styling, optional)
- Modify: `src/core/site-engine.js` (render header for site / home)
- Modify: `src/builder/views/top-bar.html` (use common header or call `wb-common-header` API)
- Modify: `tests/behaviors/ui/issues-header.spec.ts` (new tests)
- Add docs: this file `docs/COMMONHEADER.md`

---

## QA Notes
- Reuse existing `wb-issues` to avoid re-implementing submission logic and WebSocket integration.
- Keep changes incremental and test after each PR to keep rollback simple.

---

## Timeline Estimate
- Spec & small cleanup: 1–2 hours
- `wb-common-header` + styles: 3–6 hours
- Wire Home + tests: 1–2 hours
- Wire Builder + tests: 1–2 hours

---

If this spec looks good I can:
1) open a PR to remove the old links (safe, small), or
2) directly implement `wb-common-header` and wire it into Home first.

Reply with **"PR remove"** to start the cleanup PR, **"Implement header"** to start building it, or **"Edit spec"** to request changes to this document.