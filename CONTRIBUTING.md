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
## Code Quality Rules

1. **No broken links** - All CSS/JS/image paths must be valid
2. **No unregistered behaviors** - All `data-wb` values must exist in `src/behaviors/index.js`
3. **No CSS imports in pages** - Theme variables only in `src/styles/themes.css`
4. **Schema-first** - Components must have schemas before implementation
