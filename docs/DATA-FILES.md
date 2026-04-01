# Data Files Reference

The `data/` directory contains generated JSON files produced by scripts in `scripts/`. These files are outputs, not hand-edited.

## Key Files

| File | Generator | Description |
|------|-----------|-------------|
| `custom-elements.json` | `scripts/generate-custom-elements.js` | Custom Elements Manifest (CEM) for IDE intellisense |
| `docs-manifest.json` | `scripts/update-docs-manifest.js` | Scanned docs manifest (generated, not hand-maintained) |
| `search.json` | `scripts/generate-search-index.js` | Full-text search index for the docs site |
| `schema-index.json` | `scripts/build-schema-index.mjs` | Indexed schema definitions |
| `test-status.json` | MCP test runner | Live test run status (written every 2 s during runs) |
| `test-results.json` | MCP test runner | Final test results from the last async run |
| `behavior-inventory.json` | `scripts/audit-x-usage.js` | Inventory of all `x-*` behavior usages in the project |

## Usage Notes

- Scripts write to `data/*.json`. Never commit stale generated files without regenerating them first.
- `custom-elements.json` should be regenerated after adding or modifying any `<wb-*>` component schema.
- `test-status.json` and `test-results.json` are runtime artifacts — do not hand-edit them.
