# WB-Starter MVVM Migration Plan

> ## ✅ STATUS: COMPLETE (2026-06-22)
>
> The phased plan below is **historical**. An audit on 2026-06-22 found the migration
> already done on `main`:
> - **Schema Builder** (`src/core/mvvm/schema-builder.js`) ships the full v3.0 `$view` +
>   `$methods` engine; class-based detection is removed.
> - **All 97 component schemas** carry `$view`, `$methods`, and `$cssAPI`.
> - **Tier inventory:** 97 component, 15 base, 9 behavior, 4 definition, 1 page (126 total).
>
> **Completion pass (branch `feat/mvvm-migration`):**
> - Introduced a **`behavior` schema tier** for the 9 attribute/modifier schemas
>   (`otp`, `password`, `stepper`, `x-behavior`, `x-collapse`, `x-copy`, `x-draggable`,
>   `x-effects`, `x-enhancements`) — these are modifiers, not DOM-building components, so
>   they are exempt from the `$view`/`$methods`/`$cssAPI` rule. Valid tiers are now
>   `component | base | definition | behavior | page`.
> - Recognized `page` as a valid tier (`home-page.schema.json`).
> - `getComponentSchemas()` is now tier-aware (component-only).
> - Setup-example validation accepts the v3 `x-*` attribute syntax (e.g. `<form x-form>`).
> - Added missing `default`s (`collapse.target`, `behaviors.src`); purged the untracked
>   `tmp/` tree and fixed the `.gitignore` pattern that never matched it.
> - Compliance suite: the 10 schema/v3-syntax failures + the `tmp/` `html-ids` failure are
>   now green (21 → 10 remaining).
>
> **Out of scope / still open (pre-existing, unrelated to MVVM):** hardcoded CSS colors,
> docs-manifest drift, broken demo resource links (`src/styles/components.css`,
> `cards.html`, …), the `strict-mode-runtime` + `semantic-article-to-card` runtime tests
> (the latter references a missing fixture `tests/repro_card_semantic.html`).

## Overview

Migrate all 41+ components to MVVM architecture using schema-driven DOM generation.

**Goal**: User writes `<wb-card title="Hello">` → Framework builds semantic DOM from schema.

## Golden Rule: Attributes Over Slots

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. **Users should never need to know component internals.**

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero
  title="Explore"
  subtitle="Your journey"
  cta="Launch">
</wb-hero>
<!-- ❌ UGLY: User must know internal slots -->
<wb-hero>
  <h1 slot="title">Explore</h1>
  <p slot="subtitle">Your journey</p>
</wb-hero>
```

| Content Type | Use |
|--------------|-----|
| Simple text values | **Attributes** |
| Enum choices | **Attributes** |
| Boolean flags | **Attributes** |
| Arbitrary rich content | **Body (slot)** |

## MVVM Schema Structure

| Layer | Section | Purpose |
|-------|---------|---------|
| **M**odel | `properties` | Data inputs (attributes) |
| **V**iew | `$view` | DOM structure |
| **V**iew**M**odel | `$methods` | Callable functions |

### Complete Schema Example

```json
{
  "behavior": "card",
  "baseClass": "wb-card",
  
  "properties": {
    "title":    { "type": "string" },
    "subtitle": { "type": "string" },
    "footer":   { "type": "string" },
    "elevated": { "type": "boolean", "default": false },
    "variant":  { "enum": ["default", "glass", "bordered", "flat"] }
  },
  
  "$view": [
    { "name": "header",   "tag": "header", "createdWhen": "title OR subtitle" },
    { "name": "title",    "tag": "h3",     "parent": "header", "content": "{{title}}" },
    { "name": "subtitle", "tag": "p",      "parent": "header", "content": "{{subtitle}}", "createdWhen": "subtitle" },
    { "name": "main",     "tag": "main",   "required": true, "content": "{{slot}}" },
    { "name": "footer",   "tag": "footer", "createdWhen": "footer", "content": "{{footer}}" }
  ],
  
  "$methods": {
    "show":   { "description": "Shows the card", "params": [] },
    "hide":   { "description": "Hides the card", "params": [] },
    "toggle": { "description": "Toggles visibility", "params": [] },
    "update": { "description": "Updates card content", "params": ["options"] }
  }
}
```

**Class auto-generation**: `{baseClass}__{name}` → `wb-card__header`

## Detection Triggers (Keep 2)

| Trigger | Example | Status |
|---------|---------|--------|
| Web Component tag | `<wb-card>` | ✅ Keep |
| Data attribute | `<article x-card>` | ✅ Keep |
| ~~Class name~~ | ~~`<article class="wb-card">`~~ | ❌ Drop (CSS-only) |

## Schema Sections Explained

### properties (Model)
Standard JSON Schema format for component attributes:
```json
"properties": {
  "title":    { "type": "string" },
  "disabled": { "type": "boolean", "default": false },
  "variant":  { "enum": ["primary", "secondary", "danger"] }
}
```

### $view (View)
DOM structure definition with lowercase HTML5 tags:
```json
"$view": [
  { "name": "header",   "tag": "header", "createdWhen": "title" },
  { "name": "title",    "tag": "h3",     "parent": "header", "content": "{{title}}" },
  { "name": "content",  "tag": "div",    "required": true, "content": "{{slot}}" }
]
```

| Property | Purpose |
|----------|---------|
| `name` | Part identifier → generates class `{baseClass}__{name}` |
| `tag` | HTML element (lowercase) |
| `parent` | Nest inside another part |
| `content` | Template with `{{prop}}` interpolation |
| `createdWhen` | Conditional creation logic |
| `required` | Always create this element |

### $methods (ViewModel)
Callable functions exposed on the component:
```json
"$methods": {
  "open":   { "description": "Opens the modal", "params": [] },
  "close":  { "description": "Closes the modal", "params": [] },
  "submit": { "description": "Submits form data", "params": ["data"], "returns": "Promise" }
}
```

| Property | Purpose |
|----------|---------|
| `description` | What the method does |
| `params` | Expected parameters |
| `returns` | Return type (optional) |

## Migration Phases

### Phase 1: Core Infrastructure ✅
- [x] Create schema-builder.js
- [x] Create index.json for schemas
- [x] Create test page
- [ ] Update schema-builder for `$view` format
- [ ] Add `$methods` support
- [ ] Remove class-based detection

### Phase 2: Base Card (1 schema)
- [ ] card.schema.json → `$view` + `$methods`

### Phase 3: Card Variants (19 schemas)
| Schema | Status | Notes |
|--------|--------|-------|
| cardprofile | 🔄 | Needs `$view` conversion |
| cardpricing | 🔄 | Needs `$view` conversion |
| cardstats | ⏳ | |
| cardtestimonial | ⏳ | |
| cardimage | ⏳ | |
| cardhero | ⏳ | |
| cardhorizontal | ⏳ | |
| cardbutton | ⏳ | |
| cardfile | ⏳ | |
| cardlink | ⏳ | |
| cardnotification | ⏳ | |
| cardoverlay | ⏳ | |
| cardportfolio | ⏳ | |
| cardproduct | ⏳ | |
| cardvideo | ⏳ | |
| carddraggable | ⏳ | |
| cardexpandable | ⏳ | |
| cardminimizable | ⏳ | |

### Phase 4: Other Components (20+ schemas)
| Category | Schemas | Status |
|----------|---------|--------|
| Forms | button, input, select, checkbox, switch, textarea | ⏳ |
| Feedback | alert, badge, chip, progress, spinner, toast, tooltip | ⏳ |
| Layout | dialog, drawer, dropdown, tabs, navbar | ⏳ |
| Media | audio, avatar | ⏳ |
| Effects | ripple, confetti, fireworks, snow | ⏳ |

### Phase 5: Integration
- [ ] Wire schema-builder into WB.init()
- [ ] Update existing behaviors to not use innerHTML
- [ ] Add CSS for all wb-* tags
- [ ] Update documentation

## File Changes Required

### schema-builder.js Updates
```javascript
// Auto-generate class from baseClass + part name
function getPartClass(schema, partName) {
  return `${schema.baseClass}__${partName}`;
}

// Build from $view definition
function buildFromView(element, schema, data) {
  const parts = schema.$view || [];
  
  for (const part of parts) {
    if (!shouldCreate(part, data)) continue;
    
    const el = document.createElement(part.tag);  // lowercase tags
    el.className = getPartClass(schema, part.name);
    
    // Handle content
    if (part.content) {
      el.innerHTML = interpolate(part.content, data);
    }
    
    // Append to parent or root
    const parent = part.parent 
      ? element.querySelector(`.${getPartClass(schema, part.parent)}`)
      : element;
    parent?.appendChild(el);
  }
}

// Wire up $methods from schema
function bindMethods(element, schema, viewModel) {
  const methods = schema.$methods || {};
  
  for (const [name, config] of Object.entries(methods)) {
    if (typeof viewModel[name] === 'function') {
      element[name] = viewModel[name].bind(viewModel);
    }
  }
}
```

### Schema Format Changes
```
BEFORE (verbose):
"$containment": [
  { "name": "header", "tag": "HEADER" }
]

AFTER (clean):
"$view": [
  { "name": "header", "tag": "header" }
]
```

## Auto-Generated Tests

Since props, view, and methods are defined in schema, tests auto-generate:

| Test Type | Input | Expected |
|-----------|-------|----------|
| No props | `<wb-card>` | main only |
| Title | `title="X"` | header + main |
| Subtitle | `subtitle="X"` | header + main |
| Footer | `footer="X"` | main + footer |
| All props | `title + subtitle + footer` | header + main + footer |
| Variant | `variant="glass"` | has `.wb-card--glass` |
| Method | `card.show()` | card visible |
| Method | `card.hide()` | card hidden |

## Testing Strategy

1. **Unit tests**: Each schema builds correct DOM
2. **Visual tests**: Components render correctly
3. **Method tests**: All `$methods` callable and functional
4. **Comparison tests**: Old vs new output matches

## Rollback Plan

Keep old `structure.children` and `$containment` support in schema-builder as fallback until all schemas migrated.

## Timeline

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 | 1 hour | 🔴 Now |
| Phase 2 | 30 min | 🔴 Now |
| Phase 3 | 2-3 hours | 🟡 Next |
| Phase 4 | 3-4 hours | 🟢 Later |
| Phase 5 | 2 hours | 🟢 Later |

## Next Action

Update schema-builder.js to support `$view` format with lowercase tags and `$methods` binding.
