# Committing Fixes Workflow

## Overview

This document describes the standard process for fixing issues in the wb-starter project. Each fix follows a branch-based workflow with automated testing and PR-based merging.

---

## Prerequisites

- Git configured with GitHub access
- GitHub CLI (gh) installed and authenticated
- npm-runner MCP server connected to project
- All tests passing on main branch

---

## Step-by-Step Process

### 1. Start from Clean Main Branch

```bash
# Stash any uncommitted changes
git stash -u

# Switch to main and pull latest
git checkout main
git pull origin main
```

### 2. Create Feature Branch

Branch naming convention: fix/issue-type/short-description

```bash
# Examples:
git checkout -b fix/bug/issues-viewer-refresh
git checkout -b fix/ui/remove-builder-issues-button
git checkout -b fix/enhancement/add-theme-control
```

### 3. Make the Fix

1. **Locate the relevant files** - Use search/grep to find code
2. **Make minimal, focused changes** - One issue per branch
3. **Follow project standards**:
   - ES Modules only (no CommonJS)
   - Light DOM architecture
   - WBServices pattern

### 4. Write/Update Tests

Every fix MUST have a corresponding test in tests/issues/ or tests/regression/:

```typescript
// tests/issues/issue-id.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Issue: description", () => {
  test("should expected behavior", async ({ page }) => {
    await page.goto("/path/to/page");
    // Test the fix
    await expect(page.locator("selector")).toBeVisible();
  });
});
```

### 5. Run Tests to Verify Fix

```bash
# Run the specific test
npx playwright test tests/issues/test-file.spec.ts --reporter=list

# Optionally, the one category the fix touches
npx playwright test --project=behaviors --workers=8
```

Do not run the whole suite for a fix. The full suite runs nightly on `main` (see step 8).

> Tip: `npm test` is fast-by-default for developer feedback; use `npm test -- --full` (or `CI=true npm test`) to run the ordered full pipeline. See `docs/testing-runbook.md` for the recommended developer workflow, CI examples, and how to gather Playwright traces for PR investigations.

### 6. Commit Changes

The commit hook runs fast checks only (~30s): version stamp, lint ratchet on staged files, spec-collection check, register-only-shrinks check, staged control-byte check. It runs no Playwright.

### 7. Open a PR

PR CI (`.github/workflows/ci-tests.yml`) runs one Playwright check per category on windows-latest, plus "Gate scripts self-test". Its results are information.

### 8. Release

There is no release per merge. At end of day ("park") the finished PRs are merged and the Nightly workflow runs the full suite on `main`. No new failures → release and site deploy. New failures → no release, one `priority:2` issue. See `docs/standards/RELEASE-PROCESS.md`.
