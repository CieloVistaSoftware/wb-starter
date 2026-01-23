# TODO List (2026)

**Last Updated:** 2026-01-22  
**Source:** CURRENT-STATUS.md

---

## 🔴 Schema Test Fix Plan (Jan 22) — 175 tests, ~40 failing

### ✅ Priority 1: Quick Wins — DONE

- [x] **1. Fix hardcoded URL in schema-viewer.spec.ts** — Already uses relative URL
- [x] **2. Remove intentional fail test** — Already removed

### ✅ Priority 2: Duplicate Variables — DONE (Jan 23)

`npm run test:duplicates` now passes with 0 same-scope duplicates.
The previous 56 flagged duplicates were either already fixed or false positives from nested scopes.

### Priority 3: Schema Validation (20 min) — 6+ tests

| Task | Schemas Affected |
|------|------------------|
| [ ] **3. Add missing `type` fields** to properties | Run test to identify |
| [ ] **4. Fix invalid HTML in `test.setup` examples** | Run test to identify |
| [ ] **5. Fix `test.setup` behavior references** | Run test to identify |
| [ ] **6. Add `interactions.elements`** to button schemas | Run test to identify |

### Priority 4: Missing Schema Sections (15 min) — 4 tests

**Missing `compliance` section:**
- [ ] `builder-pages.schema.json`
- [ ] `features.schema.json`
- [ ] `issues.schema.json`
- [ ] `pending-issues.schema.json`

**Missing `test` section:**
- [ ] `features.schema.json`
- [ ] `issues.schema.json`
- [ ] `pending-issues.schema.json`
- [ ] `timeline.schema.json`

**Missing `$methods` section:** (v3 compliance)
- [ ] Run `npx playwright test --grep "\$methods" --reporter=list` to identify

**Missing `$cssAPI` section:** (v3 compliance)
- [ ] Run `npx playwright test --grep "\$cssAPI" --reporter=list` to identify

### Priority 5: Test Coverage (10 min) — 1 test

- [ ] Add test files for schemas that have `test` section but no coverage

### Priority 6: Integration Timeouts (30 min) — ~8 tests

These tests in `schema-builder.spec.ts` timeout at 20s:
- [ ] `wb-card should render with correct structure`
- [ ] `wb-card should apply variant class`
- [ ] `wb-card should render footer when provided`
- [ ] `hide() method should work if available`
- [ ] `show() method should work if available`
- [ ] `toggle() method should work if available`

**Diagnosis needed:** Check if `demos/schema-builder-test.html` loads correctly

---

### Quick Commands

```powershell
# Run schema tests
npx playwright test --grep "schema" --reporter=list

# Run just validation tests
npx playwright test --grep "Schema Validation" --reporter=list

# Run just v3 compliance
npx playwright test --grep "v3.0 Schema" --reporter=list

# List tests without running
npx playwright test --grep "schema" --list
```

---

## 🟡 503-Change Mass Merge Plan (High-level)

**Goal:** Safely incorporate 503 pending changes into `main` with minimal disruption, maintain CI/pass rate, and preserve incremental reviewability.

Strategy summary:
- **Partition** the 503 changes into focused, reviewable batches (~10-30 logical changes per PR depending on risk). Aim for 20–40 PRs total.
- **Branching convention:** `batch/NNn-short-description` (e.g., `batch/001-schema-fixes`, `batch/011-css-cleanup`). Keep each batch focused to one area (schemas, behaviors, styles, docs, tests, infra).
- **Commit guidelines:** Small, atomic commits with clear messages; one logical change per commit; include test updates and any schema migrations in the same branch as required.
- **PR policy:** Create PRs from each batch branch to `main` with a checklist (build, lint, tests, manual smoke test, reviewer sign-off). Use labels: `batch`, `area:schemas`, `area:styles`, `risk:low|medium|high`.
- **CI gating & tests:** Require all Playwright suites and compliance tests to pass on PR; failing tests must be investigated and fixed before merging.
- **Staging & deployment:** Merge batches to a `staging` integration branch every 3–5 PRs for an integration test run (run full test matrix + manual QA). After staging is green, merge `staging` into `main` and deploy.
- **Rollback plan:** Use Git revert PRs for each batch merge if problems appear; keep changes small to limit rollback blast radius.
- **Timeline estimate:** With a single engineer + reviewer, ~ 2-3 days per 10 batches (incl. testing) — rough total 2–3 weeks. Parallelize across 2-3 engineers for 1 week.

---

## 🟢 Builder Issues (Jan 20)

### 🟢 Bugs (Fixed)
- [x] **`updateStatus is not defined`** (builder-init.js:128) - ✅ Added guard check
- [x] **`main-section-label not found`** (builder-enhancements.js:1501) - ✅ Fallback to selector
- [x] **`canvas-main-section not found`** (builder-enhancements.js:1519) - ✅ Fallback to #canvas-main
- [x] **Excessive "State saved" spam** - ✅ Added 2-second debounce
- [x] **Put Issues control back on builder.html** - ✅ Added <wb-issues> component

### 🟡 UX Issues
- [ ] **Remove Lorem ipsum from top element** - text appearing on canvas should be in Text Content section only
- [ ] **Blue X removal button too large** - shrink it, move controls left with 1rem gap before inputs

### 🟢 Feature Requests (Lower Priority)
- [ ] **Add hover text for all attributes** - especially `data-wb-ready` explaining what it does
- [ ] **Inline Style checkbox to omit** - add "Optional" checkbox, also make global config option

---

## ✅ Completed This Session

- [x] **Issues Form Redesign** - Form-based UI with draggable/resizable dialog
- [x] **Draggable/Resizable Persistence** - localStorage with `data-persist` attribute
- [x] **Preview Spacing System** - Consistent vertical spacing (4rem/2rem/1rem)
- [x] **Builder Component HTML View** - `{ }` button shows raw HTML
- [x] **Preview Navigation Fix** - Intercepts nav links for SPA behavior
- [x] **Builder Preview Fix** - DOM extraction for preview/export

---

## 🧪 Test Commands

```powershell
# Standard tests
npm test                  # Full test suite
npm run test:compliance   # Static compliance only
npm run test:behaviors    # Behavior tests

# Schema-specific
npx playwright test --grep "schema" --reporter=list
npx playwright test --grep "Schema Validation" --reporter=list

# Cross-browser tests
npm run test:firefox      # Firefox
npm run test:webkit       # Safari/WebKit

# Utilities
npm run test:ui           # Playwright UI mode
npm run test:single       # Single-threaded (debugging)
```

---

## References

- See `docs/howtoruntests.md` for test running guide
- See `docs/builder/pages.md` for schema-driven page builder rules
- See `docs/builder.md` for builder architecture
