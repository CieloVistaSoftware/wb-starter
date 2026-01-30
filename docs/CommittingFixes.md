# Committing Fixes Workflow

## Overview

This document describes the standard process for fixing issues in the WB Framework project. Each fix follows a branch-based workflow with automated testing and PR-based merging.

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

### 6. Commit Changes

**Policy (enforced):** Do **not** commit or push code that addresses an issue until the validating test(s) for that issue pass locally. Local and CI gates will block pushes/PRs that touch issue code or issue metadata if the corresponding tests fail.

Before you edit high-risk files create a lock (see `Lock/lock.md`) and include it in your local workspace; delete the lock immediately after you finish and before pushing. Example (AI/human):

```bash
# create a local lock file (human or CI may automate this)
echo "Locked by: <you>\nTimestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > Lock/LOCKED-<filename>.md
```

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "fix(scope): concise summary

- short description of change
- reference to test(s): tests/xxx.spec.ts

Fixes #note-xxxxxxx"
```

Commit message checklist (required):
- short conventional prefix (fix/feat/chore/test)
- one-line summary + 1–3 bullet points in body
- reference to issue id (Fixes #note-...)
- include `validationTest: tests/path/to/validation.spec.ts` in the issue record when resolving

**Commit message format:**
- fix(ui): for UI issues
- fix(bug): for bugs
- fix(test): for test-only changes
- feat(enhancement): for new features

> Note: do NOT commit Lock/LOCKED-*.md files to the repo — they are local coordination artifacts.

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

Update `data/pending-issues.json` and record the validating test. Use `scripts/mark-ready-for-review.mjs` to atomically update the issue record when a validating test exists.

**Important:** do not work on or modify any issue whose `fixed` field is `true` — those are considered resolved and must be left alone by automation and humans alike.

Example JSON (record the validating test and `fixed` flag):

```json
{
  "id": "issue-id",
  "status": "fixed",
  "fixedAt": "2026-01-29T19:00:00.000Z",
  "resolution": "Fixed in PR #number",
  "testFile": "tests/issues/test.spec.ts",
  "validationTest": "tests/issues/test.spec.ts",
  "fixed": true
}
```

Quick helper (preferred):

```bash
# run the validation test and update issue atomically
node scripts/mark-ready-for-review.mjs <issueId> tests/issues/test.spec.ts
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
| Run auto PR (local) | `npm run auto:pr` (runs tests, honors locks, opens PR) |

---

## Automation (local + CI)

We provide a safe, opinionated automation flow to create an automated PR for trivial fixes and doc/data syncs. The automation is conservative: it **runs tests**, **honors Lock/**, and will **not** touch files that are locked.

Local quick-run:
- `npm run auto:pr` — runs relevant tests (or specified tests), creates a branch, commits only changed files, pushes, and opens a PR. Requires `GITHUB_TOKEN` or `GH_TOKEN` in your env.

CI:
- A scheduled/workflow dispatch action (`.github/workflows/auto-pr-on-pass.yml`) can run the same flow in CI — useful for nightly housekeeping or auto-fixing low-risk items.

When automation SHOULD NOT run:
- large refactors, behavioral changes, or API-breaking work
- edits touching many files or cross-cutting concerns

Safety checklist (automation):
- tests covering changed behavior passed locally or in CI
- no Lock/ files conflict with the changed files
- PR description includes reason + validation test

## Notes

- **One fix per branch** - Keep changes focused and reviewable
- **Tests are mandatory** - No fix is complete without a passing test
- **Squash merges** - Keep main branch history clean
- **Delete branches after merge** - Avoid branch clutter
