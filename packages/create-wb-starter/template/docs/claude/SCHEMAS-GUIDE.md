# SCHEMAS — Claude's Guide to Getting It Right

**Read this when:** Creating, editing, or testing any `.schema.json` file, or when tests reference schemas.

---

## Why Schemas Matter

Schemas are the **single source of truth** for every behavior in WB-Starter. They define what a behavior accepts (properties), what it renders ($view), what it can do ($methods), and how it's styled ($cssAPI). Everything flows from the schema — docs, IDE intellisense, tests, validation, and the builder UI.

**When the schema is wrong, everything downstream is wrong.** A missing `behavior` field means the behavior can't be registered. A missing `default` on a property means the engine can't determine baseline state. A wrong `baseClass` means CSS doesn't apply.

---

## Where Schemas Live

```
src/wb-models/                        ← All schema files live here
src/wb-models/{name}.schema.json      ← One file per behavior
src/wb-models/schema.schema.json      ← THE META-SCHEMA (defines all schemas)
src/wb-models/_base/                  ← Base/shared schema fragments
src/wb-models/semantic/               ← Semantic HTML wrapper schemas
src/wb-models/pages/                  ← Page-level schemas
```

---

## The 3 Schema Tiers

Every `.schema.json` file has a `schemaType` field that controls which rules apply. If `schemaType` is absent, it defaults to `"behavior"`.

| Tier | `schemaType` | Required Fields | Property Rules | Validated By | Examples |
|------|-------------|-----------------|---------------|-------------|----------|
| **Behavior** | `"behavior"` (default) | title, description, properties, $view, $methods, behavior/schemaFor | type + default mandatory on every property | `schema-validation.spec.ts` (full suite) | alert, badge, card variants, button, dialog |
| **Base** | `"base"` | title, description, properties | type + default mandatory on every property | `schema-validation.spec.ts` (tier checks + property checks) | _base/html-element, _base/sectioning, semantic/*, card.base |
| **Definition** | `"definition"` | title, description | none — properties section optional | `schema-validation.spec.ts` (tier checks only) | _inheritance.schema.json, schema.schema.json |
| **Page** | `"page"` | title, description, pageRules, $layout | type + default on data properties | `page-fragment-compliance.spec.ts` + page permutation tests | home-page.schema.json |

**Behavior** — Real behaviors users interact with. Full rules apply. This is the vast majority of schemas.

**Base** — Abstract schemas inherited by other schemas, never instantiated directly. They define shared properties that flow down to behaviors. `$view`, `$methods`, and `behavior`/`schemaFor` are not required because base schemas aren't registered as behaviors.

**Definition** — Pure reference documents defining rules or contracts. Not behaviors, not inherited. They document structural expectations (inheritance rules, the meta-schema itself).

**Page** — Page-level schemas defining layout rows, page rules, and content placement. Not behaviors. They require `pageRules` (showcase, fragment, noInlineStyles) and `$layout` (row-based system with columns, ratios, headings, and gap). The old `page.schema.json` with `requiredZones` (.page__hero, .page__section) is RETIRED — page structure is now defined per-page via `$layout` rows with headings.

**When creating a NEW schema, ask:** "Will this be instantiated as a behavior?" If yes → behavior. If it exists to be inherited from → base. If it's a reference doc → definition. If it defines a page layout with rows and sections → page.

---

## The Meta-Schema: `schema.schema.json`

The file `schema.schema.json` defines the structure that every `*.schema.json` file must follow. It is the self-referential root of the system — a schema that validates schemas.

It enforces (for behavior-tier schemas):

- **Required top-level fields:** `title`, `description`, `properties`, `$view`, `$methods`
- **Must have either `behavior` or `schemaFor`** (identifies the behavior)
- **Every property must have `type` + `default`** — no exceptions
- **`baseClass` pattern:** must start with `wb-` followed by lowercase kebab-case
- **`behavior` pattern:** lowercase kebab-case only
- **`$view` items** must have `name` + `tag`
- **`$methods` items** must have `description`
- **`$cssAPI` items** must have `default` + `description`
- **`test.matrix.combinations`** must be an array of objects
- **Type-safety:** string properties default to string, boolean to boolean, number to number

When Claude creates or edits any `.schema.json` file, validate it mentally against these rules for its tier. If the meta-schema would reject it, the file is wrong.

---

## Other Meta-Schema Files

Beyond `schema.schema.json`, several other schemas define and validate specific subsystems:

| File | What It Validates | Validated By |
|------|-------------------|-------------|
| `src/wb-models/schema.schema.json` | **ALL** `.schema.json` files (the root enforcer) | `schema-validation.spec.ts` (tier-aware, 16+ checks) |
| `src/wb-models/behavior.schema.json` | Behavior definitions, types, categories, interactions, events, accessibility | `schema-validation.spec.ts` (as a behavior schema) + `source-schema-compliance.spec.ts` |
| `src/wb-models/views.schema.json` | Views registry — reusable HTML templates with auto-registration | `schema-validation.spec.ts` (as a behavior schema) |
| `src/wb-models/search-index.schema.json` | Client-side search index (documents, stats, inverted index) | `schema-validation.spec.ts` (as a behavior schema) |
| `data/propertyconfig.schema.json` | Property configuration system for builder/property panel UI | Manual — no automated test yet |
| `data/simple-spa.schema.json` | Simple SPA page layout configuration | Manual — no automated test yet |
| `scripts/audit-schemas.mjs` | **Standalone audit** — tier-aware compliance check across all 101 schemas | Run directly: `node scripts/audit-schemas.mjs` |

### What `schema.schema.json` Caught

When we first ran the tier-aware audit, `schema.schema.json` rules exposed **17 non-compliant files** across the codebase:

- All 12 `semantic/*.schema.json` files — missing `$view`, `$methods`, `behavior`/`schemaFor`, and many properties missing `type` or `default`
- Both `_base/` schemas — missing `$view`, `$methods`, `behavior`/`schemaFor`
- `page.schema.json` — missing `properties`, `$view`, `$methods`, `behavior`/`schemaFor`
- `semantic/_inheritance.schema.json` — missing `properties`, `$view`, `$methods`, `behavior`/`schemaFor`
- `schema.schema.json` itself — no `schemaFor`

The fix was the 3-tier system: base/definition schemas don't need behavior-only fields. After adding `schemaType` to the 17 files and fixing missing `type`/`default` on properties, all 101 schemas now pass. **This is why the meta-schema matters — silent violations accumulate until something enforces the rules.**

Consult these meta-schemas when working in their respective domains. If you touch a meta-schema, re-run both the test and the audit.

---

## Schema Inheritance Hierarchy — The Lowest Wins

> **This is data-layer schema layering, not behavior inheritance.** The project's
> behavior architecture is composition-only: there is no behavior base class, and
> `<wb-*>` capability comes from behavior functions applied to an element (see
> `docs/claude/TIER1-LAWS.md` §2). What follows describes a *separate* mechanism —
> JSON documents merged by `allOf` / `$ref` / `$inherits` before a behavior is ever
> rendered. No runtime object inherits from another here; the loader flattens several
> JSON files into one effective schema.
>
> Whether this layer should keep the words "inheritance" / `$inherits` / IS-A /
> HAS-A, or be renamed to "schema composition" / "schema layering", is tracked
> separately in **issue #465** — do not rename it as part of #418.

Schemas form a layering chain. **The most specific (lowest) schema takes precedence.** If a lower schema defines a property that also exists in a layer above it, the lower definition wins.

```
(JSON documents merged into one effective schema — NOT a class hierarchy)

Level 0: _base/html-element.schema.json       ← every element's schema layers on this
│  _identity: id, class
│  _layout: display, position, width, height, margin, padding, overflow, z-index
│  _flexChild: grow, shrink, basis, align-self, order
│  _gridChild: column, row, justify-self, align-self
│  _accessibility: tooltip, lang, tabindex, hidden, role, aria-*
│  _behavior: draggable, contenteditable, spellcheck
│
▼
Level 1: _base/sectioning.schema.json          ← Sectioning elements
│  allOf: [ref: html-element.schema.json]
│  Defines semantic roles for article, section, nav, aside, header, footer, main
│
▼
Level 2: card.base.schema.json                 ← Shared card base
│  properties: title, subtitle, footer, variant, clickable, hoverable, elevated, size
│  compliance: baseClass "x-card", required/optional children
│  interactions: click, hover, keyboard (Enter/Space)
│  events: wb:card:click
│
▼
Level 3: cardbutton.schema.json                ← Specific variants OVERRIDE parent
         cardprofile.schema.json
         cardhero.schema.json
         cardimage.schema.json
         ... (20+ card variants)
```

### How Schema Layering Works in Practice

**Properties merge, the lower schema wins on conflict:**
- `card.base` defines `title` with `type: "string"`, `default: ""`
- `cardbutton` can redefine `title` with a different default or constraints
- The engine uses `cardbutton`'s definition, not `card.base`'s

**Compliance inherits via `$inherits`:**
```json
"compliance": {
  "$inherits": "card.base.schema.json#compliance",
  "additionalClasses": ["x-card--stats"],
  "baseClass": "x-card-stats"
}
```

**CSS follows the same chain:** Parent CSS loads first, child CSS loads after and overrides.

### Rules for Claude

1. **Never duplicate base properties in variant schemas** unless intentionally overriding.
2. **Use `$inherits` for compliance sections.** Don't copy-paste — reference the base.
3. **Fix at the RIGHT level.** If `title` is broken across all card variants, fix `card.base` — not each variant.
4. **The lowest schema is the contract.** Tests validate against the most specific schema.

---

## Required Fields by Tier

### Behavior schemas (the default)

| Field | Type | Example | Why Required |
|-------|------|---------|--------------|
| `schemaFor` | string | `"alert"` | Identifies which behavior this schema describes |
| `behavior` | string | `"alert"` | Maps schema to behavior function — registration fails without it |
| `title` | string | `"Alert"` | Human-readable name for docs/IDE |
| `description` | string | `"Alert behavior..."` | Docs, tooltips, builder UI |
| `properties` | object | `{ variant: {...} }` | All attributes the behavior accepts |
| `$view` | array | `[{ name: "root", tag: "div" }]` | DOM structure definition |
| `$methods` | object | `{}` | Public methods (can be empty) |

### Also enforced when present

| Field | When Required |
|-------|--------------|
| `baseClass` | When `compliance` section exists — CSS won't work without it |
| `compliance` | Goal: every behavior schema should have one |
| `test.setup` | When `test` section exists — must be valid HTML with `<wb-*>` or `x-behavior` |

### Base schemas

Require only: `title`, `description`, `properties`. The `$view`, `$methods`, and `behavior`/`schemaFor` fields are optional because base schemas aren't instantiated.

### Definition schemas

Require only: `title`, `description`. Everything else is optional.

---

## Property Rules — The Schema Broke 3 Times Because of These

### Every property MUST have `type` and `default`

```json
// CORRECT
"variant": {
  "type": "string",
  "description": "Visual style",
  "enum": ["info", "success", "warning", "error"],
  "default": "info"
}

// WRONG — missing default
"variant": {
  "type": "string",
  "enum": ["info", "success", "warning", "error"]
}

// WRONG — missing type
"variant": {
  "description": "Visual style",
  "default": "info"
}
```

This applies to **behavior AND base** tier schemas. Definition schemas are exempt.

### Skip dollar-prefixed properties

Properties starting with `$` (like `$inherited`, `$view`, `$methods`) are meta-directives, not behavior attributes. The test suite skips them — so should you.

### Don't use `type` as a property name

Use `variant` instead. The word `type` conflicts with the native HTML `type` attribute.

### Don't use `title` as a property name

Use `heading` instead. The native `title` attribute creates browser tooltips.

---

## The Test Suite — What Gets Validated

The schema validation test (`tests/compliance/schema-validation.spec.ts`) runs two layers of checks:

### Tier-Aware Checks (all schemas, respects `schemaType`)

1. **All schemas have title and description** — required for every tier
2. **Behavior schemas have full required fields** — properties, $view, $methods, behavior/schemaFor
3. **Base schemas have properties** — must define the properties they pass down
4. **`schemaType` values are valid** — must be `behavior`, `base`, or `definition`
5. **Tier inventory** — reports counts per tier

### Behavior-Specific Checks

6. **`schemaFor` field present** — every behavior schema identifies itself
7. **`compliance` section exists** — progress tracked (goal: all schemas)
8. **`baseClass` in compliance** — if compliance exists, baseClass must too
9. **`test` section exists** — progress tracked (goal: all schemas)
10. **`test.setup` validity** — setup HTML must contain `<wb-*>` or `x-behavior=`
11. **Setup references correct behavior** — `alert.schema.json` setup must use `<div x-alert>` or `x-alert`
12. **Property `type` and `default` fields** — every property needs both (behavior + base tiers)
13. **Enum consistency** — if permutations say `ALL_ENUM`, the `enum` array must exist
14. **Interactions consistency** — clickable elements need `click` actions
15. **Events consistency** — events referenced in interactions must be defined in `events` section
16. **Functional test completeness** — button tests need `name`, `setup`, `selector`, `expect`

### Progress Thresholds

These tighten over time as schemas improve:

| Check | Threshold | Goal |
|-------|-----------|------|
| Schemas missing compliance | < 55 | 0 |
| Schemas missing test section | < 30 | 0 |
| Setup/behavior mismatches | < 35 | 0 |
| Undefined events | < 20 | 0 |
| Missing click actions | < 10 | 0 |
| Incomplete functional tests | < 15 | 0 |

---

## How To Add or Fix a Schema

### Step 1: Read the existing schema first
```
src/wb-models/{behavior}.schema.json
```
Never create a schema from scratch if one already exists. Extend what's there.

### Step 2: Determine the tier
- Is it a real behavior? → `"behavior"` (or omit `schemaType` — it defaults)
- Is it meant to be inherited from? → `"schemaType": "base"`
- Is it a reference/rules document? → `"schemaType": "definition"`

### Step 3: Ensure required fields for the tier
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "{behavior}.schema.json",
  "title": "Behavior Name",
  "description": "What it does",
  "schemaFor": "{behavior}",
  "behavior": "{behavior}",
  "baseClass": "wb-{behavior}",
  "properties": { ... },
  "$view": [],
  "$methods": {},
  "test": {
    "setup": ["<wb-{behavior} ...></wb-{behavior}>"]
  }
}
```

### Step 4: Run the validation test
```
npm_test_async with filter: tests/compliance/schema-validation.spec.ts
```

### Step 5: Check for cascading failures
Schema changes can break other tests. After schema edits, also run:
- `tests/compliance/` — all compliance tests
- Any behavior-specific test that references the schema

---

## Common Mistakes Claude Has Made (Don't Repeat These)

1. **Wrong `behavior` value.** Must match the behavior function name, not the filename. For `cardprofile.schema.json`, behavior is `"cardprofile"` — not `"card-profile"`, not `"profile"`.

2. **Forgetting that a card variant's SCHEMA layers on `card.base.schema.json`.** (The variant *behavior* does not subclass anything — only the JSON documents merge.) Don't duplicate the shared properties — use `"$inherits": "card.base.schema.json#compliance"`.

3. **Using `x-behavior` in setup when behavior is a `<wb-*>` tag.** If registered as a custom element (`<div x-alert>`), the setup must use that tag. Only use `x-alert` for behavior-only attachment to arbitrary elements.

4. **Creating schemas for non-behavior files.** Files like `views.schema.json` and `behavior.schema.json` are meta-schemas. Don't add `behavior` or `compliance` to these — they should be `"schemaType": "base"` or `"definition"`.

5. **Not running schema validation after changes.** ALWAYS run `tests/compliance/schema-validation.spec.ts` after any schema edit.

6. **Using native HTML tags in setup instead of `<wb-*>` tags.** Setup examples like `<progress value="50">` fail validation — use `<progress value="50">`.

---

## Reference Files

| File | Purpose | Run After Touching |
|------|---------|--------------------|
| `src/wb-models/schema.schema.json` | THE META-SCHEMA — defines what all schemas must look like | `schema-validation.spec.ts` + `node scripts/audit-schemas.mjs` |
| `docs/architecture/standards/SCHEMA-SPECIFICATION.md` | Full v3.0 schema spec with examples | N/A (docs only) |
| `docs/test-schema-standard.md` | How test sections should be structured | N/A (docs only) |
| `docs/schemaTestValue.md` | Test value conventions | N/A (docs only) |
| `tests/compliance/schema-validation.spec.ts` | The validation test (tier-aware, 16+ checks) | Itself — always re-run after editing |
| `tests/compliance/source-schema-compliance.spec.ts` | Validates JS source matches schema requirements | After changing any behavior JS or schema |
| `src/wb-models/alert.schema.json` | Good example of a complete behavior schema | `schema-validation.spec.ts` |
| `scripts/audit-schemas.mjs` | Standalone tier-aware audit (all 101 schemas) | `node scripts/audit-schemas.mjs` → `data/schema-audit.json` |

---

## The Golden Rule

> **The schema is the contract.** If the schema says a property exists with type `string` and default `"info"`, then the behavior function MUST handle that property, the CSS MUST style that value, and the test MUST verify it. Fix code to match the schema — not the other way around.

The only exception: if the schema itself is wrong (outdated, contradicts v3.0 spec). Then fix the schema first, then cascade the fix to behavior + CSS + tests.
