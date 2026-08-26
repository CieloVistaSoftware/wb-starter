# Page Generation Pipeline

**Read when:** generating demo pages, creating showcases, working with `.page.json` schemas, or running `auto-showcase.mjs`.

---

## Overview

Three scripts form a pipeline that turns WB-Starter component schemas into validated, pixel-perfect HTML pages. Every generated page passes validation before a single line of HTML is written.

```
Component Schema (.schema.json)
        │
        ▼
auto-showcase.mjs ──► Page Schema (.page.json)
                              │
                              ▼
                    validate-page-schema.mjs
                              │
                              ▼  (errors? STOP)
                    generate-page.mjs ──► HTML file
```

---

## Scripts

### `scripts/validate-page-schema.mjs`

Cross-references every attribute in a `.page.json` demo against the component's `.schema.json`.

**Catches:**
- Unknown/typo attributes (not in schema properties)
- Invalid enum values (e.g., `align="middle"` when only `left|center` allowed)
- Unknown component tags (no matching schema found)
- Boolean attrs on non-boolean properties
- Missing required attrs

**Handles:** Hyphenated HTML attrs → camelCase schema props (`trend-value` → `trendValue`)

```bash
# Single page schema
node scripts/validate-page-schema.mjs src/wb-models/pages/badge-showcase.page.json

# All page schemas
node scripts/validate-page-schema.mjs --all
```

**Output:** `data/page-schema-validation.json`

---

### `scripts/generate-page.mjs`

Generates HTML from a `.page.json` schema. **Validates first** — blocks generation if errors exist.

```bash
# Validate + generate (default)
node scripts/generate-page.mjs src/wb-models/pages/badge-showcase.page.json

# Custom output path
node scripts/generate-page.mjs src/wb-models/pages/badge-showcase.page.json demos/my-badge.html

# Skip validation (rare — only if you know what you're doing)
node scripts/generate-page.mjs src/wb-models/pages/badge-showcase.page.json --skip-validation
```

**Output:** HTML file + `data/page-generator-result.json`

---

### `scripts/auto-showcase.mjs`

The big one. Feed it a component name, get a full validated showcase page automatically.

**Demo sources (priority order):**
1. `test.matrix.combinations` — real-world usage combos (best demos)
2. Enum properties — one demo per enum value
3. Boolean properties — show each toggle
4. Property defaults — fallback when no matrix exists

```bash
# By component name
node scripts/auto-showcase.mjs badge
node scripts/auto-showcase.mjs cardnotification

# By schema file path
node scripts/auto-showcase.mjs src/wb-models/badge.schema.json

# List all 86 components with matrix availability
node scripts/auto-showcase.mjs --list
```

**Output:**
- `src/wb-models/pages/{name}-showcase.page.json`
- `demos/{name}-showcase.html`
- `data/auto-showcase-result.json`

---

## Page Schema Format (.page.json)

```json
{
  "title": "Badge Showcase",
  "schemaFor": "badge-showcase",
  "page": {
    "lang": "en",
    "theme": "dark",
    "title": "Badge Showcase",
    "stylesheets": ["../src/styles/themes.css", "../src/styles/site.css"],
    "scripts": [{
      "type": "module",
      "src": "../src/core/wb-lazy.js",
      "init": "WB.init({ autoInject: true })"
    }]
  },
  "header": {
    "tag": "h1",
    "content": "Badge Showcase",
    "subtitle": { "tag": "p", "content": "All badge variants" }
  },
  "sections": [
    {
      "heading": "Section Title",
      "tag": "x-badge",
      "columns": 3,
      "demos": [
        { "tag": "x-badge", "attrs": { "label": "New", "variant": "primary" } },
        { "tag": "x-badge", "attrs": { "label": "Done", "variant": "success", "pill": true } }
      ]
    }
  ]
}
```

**Key rules:**
- `attrs` use HTML attribute names (kebab-case: `trend-value`, not `trendValue`)
- Boolean attrs: `true` renders as bare attr (`elevated`), `false` omits it
- `children` key adds inner HTML content
- `columns` sets the `x-demo` grid (1-6, default 3)

---

## File Locations

| What | Where |
|------|-------|
| Component schemas | `src/wb-models/*.schema.json` |
| Page schemas | `src/wb-models/pages/*.page.json` |
| Generated HTML | `demos/*-showcase.html` or `demos/*-generated.html` |
| Validation results | `data/page-schema-validation.json` |
| Generation results | `data/page-generator-result.json` |
| Auto-showcase results | `data/auto-showcase-result.json` |

---

## Common Tasks

### "Generate a showcase for component X"
```bash
node scripts/auto-showcase.mjs X
```
Done. Validates automatically.

### "Create a custom page schema by hand"
1. Write the `.page.json` in `src/wb-models/pages/`
2. Validate: `node scripts/validate-page-schema.mjs <path>`
3. Generate: `node scripts/generate-page.mjs <path>`

### "Validation says UNKNOWN_ATTR — is it a bug?"
Check the component's `.schema.json` properties. The attr might:
- Be camelCase in schema but you used kebab-case (auto-handled)
- Be genuinely missing from the schema → add it to the schema
- Be a typo → fix the page schema

### "I added a new property to a component schema"
Re-run validation on any page schemas that use that component to confirm they're still valid. Then re-generate.

---

## Phase 4: Multi-Page Site Generator

### `scripts/generate-site.mjs`

Generates an entire set of pages from one master `.site.json` schema. One command → 8 pages + index.

```bash
# Full build — all pages + index
node scripts/generate-site.mjs src/wb-models/pages/x-component-library.site.json

# Dry run — validate only, no files written
node scripts/generate-site.mjs src/wb-models/pages/x-component-library.site.json --dry-run

# Regenerate index only (after manual edits to pages)
node scripts/generate-site.mjs src/wb-models/pages/x-component-library.site.json --index-only
```

**Output:**
- `demos/site/{page-id}.html` — individual category pages
- `demos/site/index.html` — card grid linking to all pages
- `data/site-generator-result.json` — build report

### Site Schema Format (.site.json)

```json
{
  "title": "WB Component Library",
  "description": "...",
  "outputDir": "demos/site",
  "generateIndex": true,
  "pages": [
    {
      "id": "cards",
      "title": "Card Components",
      "description": "All card variants",
      "icon": "🃏",
      "components": ["card", "cardbutton", "cardexpandable", "..."]
    },
    {
      "id": "custom",
      "title": "Custom Page",
      "schema": "src/wb-models/pages/my-custom.page.json"
    }
  ]
}
```

**Page types:**
- `components` array → auto-showcases all listed components onto one page (matrix → enums → booleans → defaults)
- `schema` path → uses an existing `.page.json` (with full compose + validate pipeline)

### Default Site Schema

`src/wb-models/pages/x-component-library.site.json` groups 70 components into 8 categories:

| Page | Components | Demos |
|------|-----------|-------|
| 🃏 Cards | 19 | 248 |
| 🔔 Feedback & Status | 10 | 174 |
| 📝 Form Controls | 9 | 105 |
| 🪟 Overlays & Popups | 3 | 28 |
| 📐 Layout & Navigation | 9 | 41 |
| 📄 Content & Media | 7 | 32 |
| ✨ Visual Effects | 5 | 17 |
| 🔧 Interactive & Utility | 8 | 7 |

---

## DO NOT

- ❌ Write page HTML by hand — use the pipeline
- ❌ Skip validation — it exists to prevent broken pages
- ❌ Put camelCase attrs in page schemas — use kebab-case (HTML convention)
- ❌ Forget to add new component properties to the schema before using them in page schemas
- ❌ Edit generated files in demos/site/ — they get overwritten on rebuild
- ❌ Reference `page.schema.json` — it is RETIRED. Page rules are now in `schema.schema.json` (page schemaType) and per-page `$layout` definitions
