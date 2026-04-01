# Builder Testing

> **Note:** The Visual Page Builder is currently not operational. These docs are placeholders for when builder testing is restored.

## Overview

Builder tests will cover:

- Opening the builder UI
- Adding and removing components on the canvas
- Saving page changes via the server API
- Undo/redo operations
- Schema-driven property panel rendering

## Running Builder Tests

```bash
npx playwright test --project=builder
```

Builder tests are currently **skipped** in CI until the builder app is restored. See `data/test-status.json` and `docs/_today/CURRENT-STATUS.md` for current status.
