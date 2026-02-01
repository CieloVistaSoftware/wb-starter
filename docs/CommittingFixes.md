# Committing Fixes Workflow

## Overview

This document describes the standard process for fixing issues in the wb-starter project. Each fix follows a branch-based workflow with automated testing and PR-based merging.

---

## Prerequisites

- Git configured with GitHub access
- GitHub CLI (gh) installed and authenticated
- npm-runner MCP server connected to project
- All tests passing on main branch
- Follow the repository file-locking protocol in `Lock/lock.md` for multi-agent edits: create `Lock/LOCKED-{filename}.md` before editing protected or high-risk files and remove it immediately after committing. AI agents **must** include agent identity and model in the lock file.

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

# Run full test suite (sequential by project)
npm run test:duplicates
npx playwright test --project=compliance --workers=8
npx playwright test --project=regression --workers=8
npx playwright test --project=base --workers=8
npx playwright test --project=behaviors --workers=8
```

> Tip: `npm test` is fast-by-default for developer feedback; use `npm test -- --full` (or `CI=true npm test`) to run the ordered full pipeline. See `docs/testing-runbook.md` for the recommended developer workflow, CI examples, and how to gather Playwright traces for PR investigations.

### 6. Commit Changes

Before you edit high-risk files create a lock (see `Lock/lock.md`) and include it in your local workspace; delete the lock immediately after you finish and before pushing. Example (AI/human):

```bash
# create a local lock file (human or CI may automate this)
echo "Locked by: <you>\nTimestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > Lock/LOCKED-<filename>.md
```