# Data Files Reference

> **Location**: `data/*.json`  
> **Last Updated**: 2025-01-01  

This document describes all JSON files in the `data/` folder, including their purpose, structure, and the scripts or components that interact with them.

---

## Quick Reference Table

| File | Purpose | Created By | Consumed By |
|------|---------|------------|-------------|
| [behavior-inventory.json](#behavior-inventoryjson) | Runtime behavior catalog | Test runner / Web Behaviors (WB).scan() | Tests, Builder |
| [bug-registry.json](#bug-registryjson) | Bug tracking with regression tests | Manual / Claude | Tests, Documentation |
| [builder-page.json](#builder-pagejson) | Saved builder page state | Builder UI | Builder UI |
| [componentcompletions.json](#componentcompletionsjson) | Component development progress | Manual | Project tracking |
| [componentExclusions.json](#componentexclusionsjson) | Builder component exclusions | Manual | Builder |
| [content-issues.json](#content-issuesjson) | Content validation issues | [server.js](#serverjs) API | Content validators |
| [errors.json](#errorsjson) | Runtime error log | [errors-viewer.html](#errors-viewerhtml) | Error analysis |
| [fixes.json](#fixesjson) | Auto-fix registry for tests | Manual / Claude | [fix-viewer.html](#fix-viewerhtml), Tests |
| [interesting-links.json](#interesting-linksjson) | Bookmarked URLs | Manual | Reference |
| [notes.json](#notesjson) | User notes storage | Notes behavior | Notes behavior |
| [propertyconfig.json](#propertyconfigjson) | Builder property definitions | Manual | Builder property panel |
| [templates.json](#templatesjson) | Page generation templates | Manual | Builder |
| [test-failures.json](#test-failuresjson) | Test failure tracking | Test runner | Next test run |
| [test-results.json](#test-resultsjson) | Comprehensive test results | Playwright | Test analysis |

---

## Detailed Documentation

### behavior-inventory.json

**Purpose**: Catalogs all registered WB behaviors by type, with metadata about templates and input types.

**Structure**:
```json
{
  "timestamp": "2026-01-01T01:28:51.871Z",
  "totalBehaviors": 183,
  "byType": {
    "element": ["card", "hero", "badge", ...],
    "container": ["accordion", "tabs", "grid", ...],
    "modifier": ["animate", "fadein", "draggable", ...],
    "action": ["share", "darkmode", "toggle", ...]
  },
  "withTemplates": ["search", "autocomplete", ...],
  "withInputTypes": ["input", "checkbox", ...],
  "builderOnly": ["moveup", "movedown", ...],
  "errors": []
}
```

**Created By**: Generated at runtime by tests or WB framework scan operations.

**Consumed By**:
- [tests/base.ts](../tests/base.ts) - `DATA_FILES.behaviorInventory`
- Builder sidebar for categorization
- Component documentation generators

---

### bug-registry.json

**Purpose**: Tracks all discovered bugs with their fixes and required regression tests. Every bug MUST have a corresponding test.

**Structure**:
```json
{
  "metadata": {
    "description": "Registry of all bugs found during development",
    "lastUpdated": "2025-12-26",
    "totalBugs": 3,
    "testedBugs": 3,
    "untestedBugs": 0
  },
  "bugs": [
    {
      "id": "BUG-2025-12-26-001",
      "title": "Figure data-caption attribute ignored",
      "severity": "MEDIUM",
      "status": "FIXED",
      "component": "media.js",
      "regressionTests": ["tests/behaviors/ui/figure.spec.ts"],
      "testCases": ["Figure: renders caption from data-caption attribute"]
    }
  ],
  "categories": { ... },
  "componentIndex": { ... }
}
```

**Created By**: Manual entry when bugs are discovered (often by Claude during development sessions).

**Consumed By**:
- Development workflow for tracking
- Regression test validation
- Project documentation

---

### builder-page.json

**Purpose**: Stores the current state of a builder page being designed.

**Structure**:
```json
{
  "version": "1.0",
  "created": "2025-12-19T05:18:28.043Z",
  "components": [
    {
      "n": "Details",
      "i": "📑",
      "b": "details",
      "d": { "multiple": false },
      "container": true,
      "children": [...]
    }
  ]
}
```

**Created By**: [public/builder.html](../public/builder.html) - Builder UI save functionality.

**Consumed By**: Builder UI when loading saved pages.

---

### componentcompletions.json

**Purpose**: Tracks component development progress across phases (schema, compliance, tests, interactions).

**Structure**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-17T22:45:00Z",
  "phase1": {
    "target": 20,
    "complete": 20,
    "components": {
      "button": { "status": "complete", "schema": true, "compliance": true, "tests": true, "interactions": true }
    }
  },
  "allSchemas": {
    "total": 44,
    "byCategory": { ... }
  },
  "nextActions": [...]
}
```

**Created By**: Manual updates during development.

**Consumed By**: Project tracking and planning.

---

### componentExclusions.json

**Purpose**: Lists components to exclude from the builder sidebar.

**Structure**:
```json
{
  "exclude": []
}
```

**Created By**: Manual configuration.

**Consumed By**: Builder component list rendering.

**Server Route**: Served statically via Express.

---

### content-issues.json

**Purpose**: Logs content validation issues (placeholders, missing required fields, etc.).

**Structure**:
```json
{
  "lastUpdated": "2025-12-31T23:02:11.476Z",
  "issues": [
    {
      "id": "image-6",
      "behavior": "image",
      "issues": [],
      "warnings": [
        {
          "field": "src",
          "type": "placeholder",
          "message": "Source has a placeholder value",
          "value": "https://picsum.photos/500/400",
          "severity": "warning"
        }
      ],
      "isComplete": true
    }
  ]
}
```

**Created By**: [server.js](../server.js) via `/api/log-issues` endpoint.

```javascript
// server.js - POST /api/log-issues
app.post("/api/log-issues", (req, res) => {
  const payload = req.body;
  const logFile = path.join(rootDir, "data", "content-issues.json");
  // ... writes issues to file
});
```

**Consumed By**: Content validation tools and reports.

---

### errors.json

**Purpose**: Captures runtime JavaScript errors with full stack traces for debugging.

**Structure**:
```json
{
  "lastUpdated": "2026-01-01T01:15:39.417Z",
  "count": 1,
  "errors": [
    {
      "id": 1767230139416,
      "timestamp": "2026-01-01T01:15:39.416Z",
      "level": "error",
      "source": "WB:behaviors-showcase",
      "module": "index.js",
      "line": 197,
      "message": "[WB] Unknown behavior: behaviors-showcase",
      "stack": "...",
      "frames": [...],
      "url": "http://localhost:3000/index.html"
    }
  ]
}
```

**Created By**: [public/errors-viewer.html](../public/errors-viewer.html) - Error collection system.

**Consumed By**: Error analysis and debugging workflows.

---

### fixes.json

**Purpose**: Auto-fix registry mapping error signatures to their solutions. Used for test-driven fixes and documentation.

**Structure**:
```json
{
  "metadata": {
    "version": "1.0.1",
    "description": "Auto-fix registry for test failures",
    "usage": "When a test fails, extract error signature -> look up in fixes -> apply fix"
  },
  "fixes": {
    "WB_COLOR_PICKER_MISSING_001": {
      "errorId": "WB_COLOR_PICKER_MISSING_001",
      "component": "wb-color-picker",
      "errorSignature": "has at least 1 color picker",
      "issue": "wb-color-picker custom element not found",
      "fix": {
        "file": "src/behaviors/js/color-picker.js",
        "action": "Created complete WBColorPicker class",
        "code": "class WBColorPicker extends HTMLElement { ... }"
      },
      "status": "APPLIED",
      "priority": "CRITICAL"
    }
  },
  "stats": {
    "totalFixes": 45,
    "critical": 10,
    "high": 22,
    "applied": 45
  }
}
```

**Created By**: Manual / Claude during development when fixing issues.

**Consumed By**:
- [public/fix-viewer.html](../public/fix-viewer.html) - Visual fix browser
- [tests/compliance/fix-data-integrity.spec.ts](../tests/compliance/fix-data-integrity.spec.ts) - Validates fix structure
- [tests/compliance/fix-viewer.spec.ts](../tests/compliance/fix-viewer.spec.ts) - Tests fix viewer UI
- [scripts/update-fixes-code.js](../scripts/update-fixes-code.js) - Updates fix code snippets

---

### interesting-links.json

**Purpose**: Bookmarked URLs for reference during development.

**Structure**:
```json
[
  {
    "id": 1735689600000,
    "url": "https://github.com/GMaN1911/claude-cognitive",
    "title": "Claude Cognitive",
    "description": "Interesting repository about Claude Cognitive architecture"
  }
]
```

**Created By**: Manual entry.

**Consumed By**: Reference only.

---

### notes.json

**Purpose**: Persistent storage for the notes behavior.

**Structure**:
```json
{
  "notes": []
}
```

**Created By**: [src/behaviors/js/notes.js](../src/behaviors/js/notes.js) - Notes behavior.

**Consumed By**: Notes behavior for display and editing.

---

### propertyconfig.json

**Purpose**: Defines UI types, property configurations, and component defaults for the builder property panel.

**Structure**:
```json
{
  "$schema": "./propertyconfig.schema.json",
  "version": "1.0.0",
  "uiTypes": {
    "text": { "component": "input", "inputType": "text" },
    "number": { "component": "input", "inputType": "number" },
    "checkbox": { "component": "checkbox" },
    "select": { "component": "select" }
  },
  "properties": {
    "title": {
      "label": "Title",
      "ui": "canvasEditable",
      "default": "Title",
      "category": "content"
    }
  },
  "categories": {
    "content": { "label": "📝 Content", "order": 1 },
    "media": { "label": "🖼️ Media", "order": 2 }
  },
  "componentDefaults": {
    "card": { "title": "Card Title", "elevated": false }
  }
}
```

**Created By**: Manual configuration.

**Consumed By**:
- Builder property panel ([src/builder/builder-properties.js](../src/builder/builder-properties.js))
- [tests/base.ts](../tests/base.ts) - `DATA_FILES.propertyConfig`

**Server Route**: Served statically via Express.

---

### templates.json

**Purpose**: Registry of pre-defined page layouts and component combinations for instant page generation.

**Structure**:
```json
{
  "categories": [
    { "id": "heroes", "name": "Hero Sections", ... }
  ],
  "templates": [
    {
      "id": "hero-minimal",
      "name": "Minimal Hero",
      "category": "heroes",
      "components": [...]
    }
  ]
}
```

**Created By**: Manual configuration.

**Consumed By**: Builder UI for template selection.

**Documentation**: [docs/templates.md](templates.md)

---

### test-failures.json

**Purpose**: Tracks test failures from builder property validation for the next test run.

**Structure**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "description": "Test failures from builder property validation",
    "source": "builder-validation"
  },
  "pendingTests": [],
  "failures": [],
  "stats": {
    "totalFailures": 0,
    "schemaErrors": 0,
    "behaviorErrors": 0,
    "lastRunDate": null
  }
}
```

**Created By**: Test runner when failures occur.

**Consumed By**: Subsequent test runs for retry logic.

---

### test-results.json

**Purpose**: Comprehensive Playwright test results with pass/fail details.

**Structure**: Large JSON file with test suite results, timing, and failure details.

**Created By**: Playwright test runner via custom reporter.

**Consumed By**: Test analysis and CI/CD pipelines.

**Location**: Also stored in `data/test-results/` directory with timestamped files.

---

## Related Scripts

### server.js

The Express server that handles API endpoints for data files:

```javascript
// POST /api/log-issues - Writes to content-issues.json
// POST /api/save - Generic save endpoint for any data file
```

[View server.js](../server.js)

### scripts/update-fixes-code.js

Updates fix code snippets in fixes.json:

[View update-fixes-code.js](../scripts/update-fixes-code.js)

### scripts/update-docs-manifest.js

Updates the docs manifest (not a data file, but related):

[View update-docs-manifest.js](../scripts/update-docs-manifest.js)

---

## Test Coverage

These tests validate data file integrity:

| Test File | Validates |
|-----------|-----------|
| [tests/compliance/fix-data-integrity.spec.ts](../tests/compliance/fix-data-integrity.spec.ts) | fixes.json structure |
| [tests/compliance/fix-viewer.spec.ts](../tests/compliance/fix-viewer.spec.ts) | Fix viewer UI with fixes.json |
| [tests/compliance/behavior-registry.spec.ts](../tests/compliance/behavior-registry.spec.ts) | Behavior registry consistency |

---

## Best Practices

1. **Never manually edit test-results.json** - It's auto-generated by Playwright.
2. **Always add regression tests** when adding to bug-registry.json.
3. **Keep fixes.json updated** - Every applied fix should have status "APPLIED".
4. **Use the API endpoints** - Don't write directly to content-issues.json from client code.
5. **Validate JSON before committing** - Malformed JSON will break the server.

---

## File Lifecycle

| Action | Files Affected |
|--------|----------------|
| `npm test` | test-results.json, test-failures.json |
| Builder save | builder-page.json |
| Content validation | content-issues.json |
| Bug fix applied | fixes.json, bug-registry.json |
| Runtime error | errors.json |
