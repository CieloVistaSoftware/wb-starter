# TypeScript Migration Plan

## Two Migration Paths

Choose based on preference and available help.

---

## PATH A: Batch Rename + Compile (Fast)

**Best for:** Quick conversion, fix errors as they appear

### Steps
1. Rename all .js to .ts in a folder
2. Run: npx tsc --project tsconfig.json
3. Fix compile errors
4. Run Layer 0 tests
5. Repeat for next folder

### Folder Order
1. src/wb-viewmodels/ (54 files) - IN PROGRESS
2. src/wb-services/
3. src/wb-core/
4. src/*.js (root files)

### Commands
```bash
# Rename (Node)
node -e "require(fs).readdirSync(DIR).filter(f=,f.replace(.js,.ts)))"

# Compile
npx tsc

# Test
npx playwright test --project=layer0-syntax
```

### PATH A — Tasks to complete (batch rename + compile)
Follow this checklist per-folder (one PR per folder recommended):

- [ ] Create a Lock: add `Lock/LOCKED-<folder-or-file>.md` (your-name + timestamp).
- [ ] Create branch: `git checkout -b ts/migrate/<folder>`.
- [ ] Run a dry-rename on a copy to estimate errors: `git mv --dry-run **/*.js **/*.ts` or use a small script to preview renames.
- [ ] Automated rename (idempotent): run the repo-safe rename script against the target folder.
- [ ] Compile & triage in waves:
  - `npx tsc --project tsconfig.json --noEmit --pretty --skipLibCheck` (capture first 200 errors)
  - Fix errors in priority order: missing imports, obvious any-typed params, DOM typings, then internal interfaces.
- [ ] Add focused type shims for external dependencies (temporary .d.ts files) rather than broad `any` where possible.
- [ ] Run Layer‑0 syntax checks and focused behavior tests for the folder (examples below).
  - `npx playwright test --project=layer0-syntax -g "<feature-or-file>"`
- [ ] Add unit / Playwright focused tests for any regressions discovered during compile fixes.
- [ ] Commit small, reversible changes (<= 200 LOC); include `WHY` in the commit message for non-obvious type choices.
- [ ] Open PR with the `ts/migrate/<folder>` branch, include:
  - list of files changed
  - `npx tsc --noEmit` output summary (first 10 errors fixed)
  - focused test command(s) + results
  - request `repo-maintainers` review and mark `needs-ci`.
- [ ] Once CI passes, merge and delete the lock file; add a one-line changelog entry: `docs/CHANGELOG.md` → Migration note.

### Commands & helpers (batch)
```bash
# Preview rename (dry-run)
node scripts/preview-rename.mjs src/wb-viewmodels --ext .ts

# Bulk rename (use with caution)
node scripts/rename-to-ts.mjs src/wb-viewmodels

# Fast compile + error snapshot
npx tsc --project tsconfig.json --noEmit | head -n 200 > tmp/ts-errors-snapshot.txt

# Focused tests for the migrated folder
npx playwright test --project=layer0-syntax -g "builder-theme" --trace=on

# Create PR (template)
# - branch: ts/migrate/<folder>
# - title: chore(ts): migrate <folder> to TypeScript
# - body: include the checklist, affected files, and quick test summary
```

### Rollback & safety
- If migration introduces regressions not easily fixed in the same PR, revert the rename (git revert or restore the files) and open a follow-up issue with the failure trace.  
- Prefer temporary shims and incremental tightening to large sweeping type changes.

### Completion criteria (per-folder)
- `npx tsc --noEmit` passes for the folder (or errors reduced to known/owned list).  
- Focused Playwright tests for folder/features pass locally and in CI.  
- PR merged, lock removed, and changelog entry added.

---

## PATH B: File-by-File with Types (Thorough)

**Best for:** Adding proper types as you go, learning codebase

### Quick checklist (Path B — file-by-file)
- [ ] Create a lock: add `Lock/LOCKED-<relative-path>.md` with your name + timestamp before editing.
- [ ] Branch: `git checkout -b ts/migrate/<folder-or-file>` (one file per PR).
- [ ] Minimal rename + types: rename `.js` → `.ts`, add narrow types (params/returns/interfaces); prefer incremental `any` → tighten later.
- [ ] Compile-only sanity: `npx tsc --noEmit --pretty <path/to/file.ts>` (fix errors until green).
- [ ] Run quick checks: `npm run typecheck` and `npx playwright test --project=layer0-syntax -g "<file-or-feature>"`.
- [ ] Create small PR (single file, <200 LOC change) with PR checklist and tests passing.
- [ ] Release lock after merge and add a one-line changelog entry.

### Quick commands (copy/paste)
```bash
# create lock (replace PATH)
echo "Migrating PATH — $(whoami) — $(date -u +%FT%T%Z)" > Lock/LOCKED-PATH.md

# branch and rename
git checkout -b ts/migrate/path-to-file
git mv src/path/to/file.js src/path/to/file.ts

# compile just that file (fast sanity check)
npx tsc --noEmit src/path/to/file.ts
# or full project typecheck
npm run typecheck

# focused syntax test(s)
npx playwright test --project=layer0-syntax tests/compliance/builder-theme-event-handler.spec.ts -g "<test name>"

# commit & push
git add src/path/to/file.ts Lock/LOCKED-PATH.md
git commit -m "chore(ts): migrate src/path/to/file.ts (incremental)" 
git push --set-upstream origin ts/migrate/path-to-file
```

### PR checklist (minimum)
- [ ] Lock file created before edit
- [ ] Single-file scope and <200 LOC
- [ ] `npx tsc --noEmit` passes locally
- [ ] Relevant focused Playwright tests pass (layer0 / issues subset)
- [ ] CI green for the PR before merging

---

### Priority Files (by impact)

### Priority Files (by impact)
1. draggable.ts - DONE
2. resizable.ts - similar pattern
3. tooltip.ts - simple DOM
4. dropdown.ts - event handling
5. tabs.ts - state management
6. modal/dialog.ts - complex DOM

### Type Sources
- src/types/behaviors.d.ts (auto-generated from schemas)
- Inline interfaces for internal types
- DOM types from lib.dom.d.ts (built-in)

---

## Shared Infrastructure

Both paths use:
- tsconfig.json (permissive settings)
- src/types/behaviors.d.ts (generated interfaces)
- Layer 0 tests for validation
- npm run build / npm run typecheck

## tsconfig.json Settings
```json
{
  "noImplicitAny": false,
  "strictNullChecks": false,
  "allowJs": true,
  "skipLibCheck": true
}
```

## After Migration Complete

1. Enable strictNullChecks
2. Enable noImplicitAny
3. Add explicit types to public APIs
4. Remove allowJs

## Key Files
- tsconfig.json - compiler config
- src/types/behaviors.d.ts - generated interfaces
- scripts/gen-types.mjs - regenerate interfaces
- tests/layer0-syntax/ - syntax validation tests
