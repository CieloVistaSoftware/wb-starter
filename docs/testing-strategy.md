# Web Behaviors (WB) Testing Strategy

## Core Principle
**Testing proves wellbeing. NO GAPS ALLOWED.**

Every bug found MUST have:
1. Entry in `data/bug-registry.json`
2. Regression test in `tests/regression/`
3. Permutation coverage in schemas
4. Documentation of root cause and fix

---

## Test Structure

```
tests/
├── behaviors/
│   ├── permutation-compliance.spec.ts   # Schema-driven permutation tests
│   └── ui/
│       ├── audio.spec.ts                # Component-specific tests
│       ├── card.spec.ts
│       └── ...
├── compliance/
│   ├── builder-mkEl-compliance.spec.ts  # Builder function tests
│   ├── test-coverage-compliance.spec.ts # Meta-test: ensures coverage
│   ├── html-ids.spec.ts                 # Enforces IDs on all elements
│   ├── no-scrollbars.spec.ts            # Enforces CSS scrollbar rules
│   └── ...
└── regression/
    └── regression-tests.spec.ts         # Bug fix verification
```

---

## Bug Tracking Process

### 1. Bug Found
When a bug is discovered:

```bash
# Add to bug registry
data/bug-registry.json
```

Required fields:
- `id`: BUG-YYYY-MM-DD-NNN
- `title`: Brief description
- `severity`: HIGH | MEDIUM | LOW
- `component`: Affected file
- `function`: Affected function
- `rootCause`: Why it happened
- `symptom`: What user saw
- `fix`: Before/after code
- `affectedComponents`: All behaviors impacted
- `regressionTests`: Test files covering this
- `testCases`: Specific test names

### 2. Fix Applied
After fixing the bug:

1. Add regression test to `tests/regression/regression-tests.spec.ts`
2. Add permutations to affected schema(s)
3. Update bug registry with test references
4. Run all tests to verify

### 3. Verification
The compliance tests will FAIL if:
- Any bug has no regression tests
- Any bug has no test cases documented
- `untestedBugs` count > 0

---

## Schema Test Section

Every schema SHOULD have a `test` section:

```json
{
  "test": {
    "setup": [
      "<div data-wb=\"component\" data-prop=\"value\"></div>"
    ],
    "matrix": {
      "combinations": [
        { "prop1": "value1" },
        { "prop1": "value2", "prop2": true }
      ]
    },
    "functional": {
      "critical": [
        {
          "name": "REGRESSION: describe the bug fix",
          "bugId": "BUG-2024-12-19-001",
          "setup": "<div ...></div>",
          "expect": { ... }
        }
      ],
      "rendering": [...],
      "buttons": [...],
      "keyboard": [...]
    }
  }
}
```

---

## Permutation Types

Schemas define permutations for each property:

| Type | Description | Example |
|------|-------------|---------|
| `BOOLEAN` | Tests true/false | `{ "type": "BOOLEAN" }` |
| `ALL_ENUM` | All enum values | `{ "type": "ALL_ENUM" }` |
| `BOUNDARY_NUMBER` | Min/max/mid values | `{ "values": [0, 50, 100] }` |
| `EXPLICIT` | Custom values | `{ "values": ["a", "b", "c"] }` |

Each permutation can have assertions:

```json
{
  "permutations": {
    "type": "BOOLEAN",
    "assertions": {
      "true": {
        "selector": ".component__panel",
        "checks": { "exists": true }
      },
      "false": {
        "selector": ".component__panel",
        "checks": { "exists": false }
      }
    }
  }
}
```

---

## Running Tests

```bash
# All tests
npx playwright test

# Specific test file
npx playwright test tests/regression/regression-tests.spec.ts

# Coverage compliance
npx playwright test tests/compliance/test-coverage-compliance.spec.ts

# With UI
npx playwright test --ui
```

---

## Coverage Requirements

1. **Bug Registry**: 100% test coverage (untestedBugs = 0)
2. **Critical Components**: Must have dedicated test files
3. **Enum Properties**: Must have permutation coverage
4. **Boolean Properties**: Should have true/false tests
5. **Regression Tests**: Must exist for all bug IDs

---

## Example: Adding a Bug Fix Test

Bug found: Audio src goes to wrong place

### 1. Add to bug-registry.json:

```json
{
  "id": "BUG-2024-12-19-001",
  "title": "Audio src attribute set on div instead of dataset",
  "severity": "HIGH",
  "component": "builder.js",
  "function": "mkEl()",
  "affectedComponents": ["audio", "video", "cardimage"],
  "regressionTests": ["tests/regression/regression-tests.spec.ts"],
  "testCases": ["Audio: src goes to dataset.src NOT native src attribute"]
}
```

### 2. Add regression test:

```typescript
test('Audio: src goes to dataset.src NOT native src attribute', async ({ page }) => {
  // Setup
  await page.evaluate(() => {
    window.add({ n: 'Audio', b: 'audio', d: { src: 'test.mp3' } });
  });
  
  // Verify dataset has src
  const datasetSrc = await element.evaluate(el => el.dataset.src);
  expect(datasetSrc).toBe('test.mp3');
  
  // Verify native src is NOT set on div
  const nativeSrc = await element.getAttribute('src');
  expect(nativeSrc).toBeNull();
});
```

### 3. Add to schema:

```json
{
  "test": {
    "functional": {
      "critical": [
        {
          "name": "REGRESSION: src goes to dataset NOT native attribute",
          "bugId": "BUG-2024-12-19-001",
          "expect": {
            "checks": {
              "datasetHas": { "src": "..." },
              "nativeAttributeAbsent": "src"
            }
          }
        }
      ]
    }
  }
}
```

---

## Summary

| What | Where | Required |
|------|-------|----------|
| Bug tracking | `data/bug-registry.json` | YES |
| Regression tests | `tests/regression/` | YES |
| Component tests | `tests/behaviors/ui/` | CRITICAL |
| Permutation tests | `tests/behaviors/permutation-compliance.spec.ts` | YES |
| Schema test section | `src/behaviors/schema/*.schema.json` | RECOMMENDED |
| Coverage validation | `tests/compliance/test-coverage-compliance.spec.ts` | AUTO |

**Remember: Testing proves wellbeing. NO GAPS ALLOWED.**
