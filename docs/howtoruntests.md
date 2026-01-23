# How to Run Tests

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npx playwright test --grep "pattern"` | Run tests matching pattern |
| `npx playwright test --project=compliance` | Run only compliance tests |
| `npx playwright test --list` | List all tests without running |

---

## Running Tests by Pattern (Recommended for Windows)

The `--grep` flag is the most reliable way to run specific tests on Windows:

```powershell
# Run all schema-related tests
npx playwright test --grep "schema" --reporter=list

# Run all builder tests
npx playwright test --grep "builder" --reporter=list

# Run all behavior tests
npx playwright test --grep "behavior" --reporter=list

# Case-insensitive pattern matching
npx playwright test --grep "issues" --reporter=list
```

---

## Running Tests by Project

Projects are defined in `playwright.config.ts`:

```powershell
# Run compliance tests only (static checks, no browser)
npx playwright test --project=compliance --reporter=list

# Run behavior tests
npx playwright test --project=behaviors --reporter=list

# Run issues modal tests
npx playwright test --project=issues-modal --reporter=list
```

---

## Running Specific Test Files

On Windows, use quotes and forward slashes:

```powershell
# Single file
npx playwright test "tests/compliance/schema.spec.ts" --reporter=list

# Or use backslashes
npx playwright test tests\compliance\schema.spec.ts --reporter=list
```

---

## Useful Flags

| Flag | Description |
|------|-------------|
| `--reporter=list` | Show test names as they run |
| `--headed` | Show browser window (for debugging) |
| `--debug` | Step through tests in debugger |
| `--ui` | Open Playwright Test UI |
| `--workers=1` | Run single-threaded (easier debugging) |

---

## Examples

```powershell
# Debug a failing test with visible browser
npx playwright test --grep "modal" --headed --workers=1

# Open Playwright UI for interactive testing
npx playwright test --ui

# List tests without running (verify patterns)
npx playwright test --grep "builder" --list

# Run with verbose output
npx playwright test --grep "schema" --reporter=list 2>&1
```

---

## npm Scripts

These are defined in `package.json`:

```powershell
npm test                # Run all tests
npm run test:compliance # Static compliance tests
npm run test:behaviors  # Behavior tests
npm run test:ui         # Playwright UI mode
npm run test:single     # Single-threaded (debug)
npm run test:firefox    # Firefox only
npm run test:webkit     # Safari/WebKit only
npm run test:mobile     # Mobile browsers
npm run test:browsers   # All browsers
```

---

## Troubleshooting

### Tests not found with file path
Use `--grep` pattern matching instead of file paths:
```powershell
# Instead of this (may fail on Windows):
npx playwright test tests/compliance/schema.spec.ts

# Use this:
npx playwright test --grep "schema"
```

### Tests hang with no output
Try running with `--reporter=list` to see progress:
```powershell
npx playwright test --grep "pattern" --reporter=list
```

### Need to see what's happening
Use headed mode:
```powershell
npx playwright test --grep "pattern" --headed --workers=1
```
