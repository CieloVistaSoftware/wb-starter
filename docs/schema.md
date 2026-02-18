# Schema Standards for Web Behaviors (WB) Components & Pages

## Purpose
This document defines the standard structure and conventions for all JSON schemas used in the WB project.

---

## 1. Schema Types (4 Tiers)

All schemas live in `src/wb-models/` and are validated by the meta-schema `schema.schema.json`.

| Type | `schemaType` | Required Fields | Examples |
|------|-------------|-----------------|----------|
| **Component** | `"component"` (default) | title, description, properties, $view, $methods, behavior/schemaFor | alert, badge, card variants |
| **Base** | `"base"` | title, description, properties | _base/html-element, card.base |
| **Definition** | `"definition"` | title, description | _inheritance.schema.json, schema.schema.json |
| **Page** | `"page"` | title, description, pageRules, $layout | home-page.schema.json |

---

## 2. Required Top-Level Properties

| Property | Type | Description |
|----------|------|-------------|
| `$schema` | string | JSON Schema version reference |
| `title` | string | Human-readable name |
| `description` | string | Short description |
| `schemaFor` | string | Unique name of the component or page |
| `schemaType` | string | One of: component, base, definition, page |

---

## 3. Core Sections

- `properties`: Data model (attributes, fields)
- `$view`: DOM structure, tags, layout
- `$methods`: Callable functions (ViewModel layer)
- `compliance`: Accessibility, support level, required children
- `$cssAPI`: Custom CSS variables and styling hooks
- `test`: Setup and validation for automated tests
- `pageRules`: Page-level rules (fragment, showcase, noInlineStyles) — page schemas only
- `$layout`: Row-based layout definition (columns, ratios, headings, gap) — page schemas only

---

## 4. Page Schema Layout ($layout)

Page schemas use a row-based layout system:

```json
"$layout": {
  "gap": "2rem",
  "maxWidth": "1200px",
  "rows": [
    { "columns": 1, "width": "full-bleed", "headingLevel": 1, "content": ["hero"] },
    { "columns": 1, "width": "900px", "heading": "Stats", "headingLevel": 2, "content": ["stats"] },
    { "columns": 2, "ratio": "60/40", "heading": "Demos", "headingLevel": 2, "content": ["notifications", "audio"] }
  ]
}
```

Row properties: `columns`, `rows` (fixed count), `direction` (row/column), `ratio`, `width`, `align`, `heading`, `headingLevel`, `subheading`, `gap`, `content`.

---

## 5. Property Rules

Every property in component and base schemas MUST have `type` and `default`:

```json
"variant": {
  "type": "string",
  "enum": ["info", "success", "warning", "error"],
  "default": "info"
}
```

---

## 6. RETIRED

- `page.schema.json` — old page contract with `requiredZones` (.page__hero, .page__section). Replaced by `$layout` rows with headings in `schema.schema.json` (page schemaType).
- The old `behavior` property is replaced by `schemaFor` for clarity.

---

## 7. Reference

| File | Purpose |
|------|---------|
| `src/wb-models/schema.schema.json` | Meta-schema — defines all schema tiers |
| `docs/architecture/standards/SCHEMA-SPECIFICATION.md` | Full v3.0 schema spec |
| `docs/claude/SCHEMAS-GUIDE.md` | Claude's guide to schemas |
