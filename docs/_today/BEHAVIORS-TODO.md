# Behaviors Test Fix TODO
**Created:** 2026-02-10
**Source:** Behavior suite run — 58 pass / 72+ fail out of 466 tests

---

## Root Cause Analysis

### 🔴 Issue #1: `data-wb` Legacy Syntax in Tests (60+ failures)
**File:** `tests/behaviors/behavior-verification.spec.ts`
**Error:** `TypeError: identifier.toLowerCase is not a function`
**Root cause:** Tests use `data-wb="rating"`, `data-wb="table"`, etc. WB v3.0 marks these as LEGACY and does NOT inject behaviors. When tests interact with uninitialized elements, the framework throws `identifier.toLowerCase` from behaviors that never initialized.
**Fix:** Update `createAndScan()` helper to use `x-*` attributes (e.g., `x-rating`) or `wb-*` custom elements instead of `data-wb`.
**Impact:** Fixes ~60 tests (rating, table, animations, cards, spinner, drawer, forms, confetti)

### 🟡 Issue #2: Locator API Misuse in behavior-validation (2 failures)
**File:** `tests/behaviors/behavior-validation.spec.ts`
**Error:** `Cannot read properties of undefined (reading 'contains')`
**Root cause:** Line ~449: `element.classList.contains('wb-ready')` — `element` is a Playwright Locator, not an HTMLElement. Locators don't have `.classList`.
**Fix:** Replace with `await element.evaluate(el => el.classList.contains('wb-ready'))`
**Impact:** Fixes 2 tests (element behaviors initialize, action behaviors triggers)

### 🟡 Issue #3: Autoinject Expectations Wrong (3 failures)
**File:** `tests/behaviors/autoinject.spec.ts`
**Error:** Timeout waiting for `.wb-select`, `.wb-card`, `.wb-checkbox` classes
**Root cause:** Tests expect specific CSS classes that autoinject doesn't add, OR the autoinject demo page doesn't have autoInject enabled.
**Fix:** Verify autoinject.html has `WB.init({ autoInject: true })`, then update class expectations to match actual behavior.
**Impact:** Fixes 3 tests

### 🟢 Issue #4: Badge `display: inline-block` (1 failure)
**File:** `tests/behaviors/badge.spec.ts`
**Error:** CSS display mismatch — expecting `inline-block`
**Root cause:** Badge CSS likely renders as `inline-flex` or `flex` instead of `inline-block`.
**Fix:** Check actual computed style, update test expectation to match.
**Impact:** Fixes 1 test

---

## Fix Priority Order
1. **Issue #1** — Single fix in `createAndScan()` unblocks 60+ tests
2. **Issue #2** — Quick Locator API fix, 2 tests
3. **Issue #3** — Autoinject investigation, 3 tests  
4. **Issue #4** — Badge CSS check, 1 test

## Tests Still Running
Suite has 466 total tests. Remaining ~336 tests (showcase, permutation, pce, scrollalong, sticky, etc.) are still executing. This TODO will be updated when the full run completes.
