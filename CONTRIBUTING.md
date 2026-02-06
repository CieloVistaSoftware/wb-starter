# Contributing to WB Starter

## Pre-commit Hook Setup

To ensure code quality, set up the pre-commit hook that runs integrity tests before each commit.

### Option 1: Manual Git Hook (Recommended)

```bash
# Copy the pre-commit hook to your git hooks directory
cp .husky/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Option 2: Run Manually Before Commits

```bash
npm run precommit
```

### What the Pre-commit Hook Checks

1. **JS Import Integrity** - All import statements resolve to existing files
2. **HTML Resource Integrity** - All `<script>`, `<link>`, `<img>` tags point to existing files
3. **Behavior Usage Integrity** - All `data-wb` attributes reference valid registered behaviors

## Running Tests

```bash
# Run all tests
npm test

# Run only integrity tests (fast)
npm run test:integrity

# Run compliance tests
npm run test:compliance

# Run with UI
npm run test:ui
```

**Note (test runner):** `npm test` is a safety-wrapper (fast-by-default). Use `npm test -- --full`, `npm run test:ordered`, or set `CI=true` to run the ordered full pipeline. See `docs/testing-runbook.md` for recommended developer workflows and CI examples.

### Producing and publishing Playwright artifacts (traces) 🔍

- Quick local repro (produces `trace.zip`):

```bash
# focused compliance (local)
npx playwright test tests/compliance/no-observer-referror.spec.ts \
  --trace=on --reporter=list

# or run a named compliance project
npx playwright test --project=compliance --trace=on
```

- Where to find artifacts locally:
  - `data/test-results/**/trace.zip`
  - `data/test-results/.last-run.json`
  - `data/test-results/.../run.log`

- How to publish/download artifacts on CI:
  - Use the **Manual Compliance** workflow (Actions → Manual Compliance) to run focused tests on any ref and upload `trace.zip` automatically.
  - Or ask maintainers to re-run the PR workflow; artifacts will appear under the job **Artifacts** panel.

- Quick GH CLI (manual run):

```bash
# open the Actions UI for the repo and select 'Manual Compliance'
# or use gh to dispatch (if workflow supports it):
gh workflow run "Manual Compliance (dispatch)" -f ref=main -f tests="tests/compliance/no-observer-referror.spec.ts" -f trace=true
```

Please attach the generated `trace.zip` to the PR when reporting flaky failures.

---

## Updating `docs/_today` (required for docs changes) ⚠️

When you change any files under `docs/` (except `docs/_today`), you MUST add a one-line entry to `docs/_today/TODO.md` or `docs/_today/CURRENT-STATUS.md` that references the changed file and a short summary.

- Why: `docs/_today` is the canonical place for recent work and rollup notes; the project uses automated checks to ensure it's kept up to date.

- How to write the entry (example):

```markdown
- [ ] docs/guide/custom-elements.md — update API example for v2 (author: @you)
```

- Quick check (local):

```bash
# verify changed docs are mentioned in docs/_today
npm run check:today-updated
```

The PR check will fail if you modify `docs/` and do not mention the change in `docs/_today`.
## Code Quality Rules

1. **No broken links** - All CSS/JS/image paths must be valid
2. **No unregistered behaviors** - All `data-wb` values must exist in `src/behaviors/index.js`
3. **No CSS imports in pages** - Theme variables only in `src/styles/themes.css`
4. **Schema-first** - Components must have schemas before implementation