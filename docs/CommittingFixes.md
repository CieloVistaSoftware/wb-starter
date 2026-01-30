# Committing Fixes Workflow

## Overview

This document describes the standard process for fixing issues in the WB Framework project. Each fix follows a branch-based workflow with automated testing and PR-based merging.

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

# Run full test suite (sequential by project)
npm run test:duplicates
npx playwright test --project=compliance --workers=8
npx playwright test --project=regression --workers=8
npx playwright test --project=base --workers=8
npx playwright test --project=behaviors --workers=8
```

### 6. Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "fix(scope): description

- bullet point of change
- bullet point of change

Fixes #issue-id"
```

**Commit message format:**
- fix(ui): for UI issues
- fix(bug): for bugs
- fix(test): for test-only changes
- feat(enhancement): for new features

### 7. Push Branch

```bash
git push -u origin branch-name
```

### 8. Create Pull Request

```bash
gh pr create --title "fix(scope): description" --body "## Summary
brief description of fix

## Changes
- change 1
- change 2

## Testing
- [ ] Test passes
- [ ] Full suite passes

## Issue
Fixes #issue-id"
```

### 9. Merge PR

After PR is created and checks pass:

```bash
gh pr merge --squash --delete-branch
```

### 10. Update Issue Status

Update data/pending-issues.json:

```json
{
  "id": "issue-id",
  "status": "fixed",
  "fixedAt": "ISO timestamp",
  "resolution": "Fixed in PR #number",
  "testFile": "tests/issues/test.spec.ts"
}
```

---

## Quick Reference Commands

| Action | Command |
|--------|--------|
| Stash changes | git stash -u |
| Create branch | git checkout -b fix/type/name |
| Run single test | npx playwright test path --reporter=list |
| Stage all | git add . |
| Commit | git commit -m "message" |
| Push new branch | git push -u origin branch |
| Create PR | gh pr create --title "..." --body "..." |
| Merge PR | gh pr merge --squash --delete-branch |
| Return to main | git checkout main and git pull |

---

## Notes

- **One fix per branch** - Keep changes focused and reviewable
- **Tests are mandatory** - No fix is complete without a passing test
- **Squash merges** - Keep main branch history clean
- **Delete branches after merge** - Avoid branch clutter
