# Web Behaviors (WB) MVVM Migration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER WRITES HTML                        │
├─────────────────────────────────────────────────────────────┤
│  <wb-card title="Hello">Content</wb-card>                  │
│                        OR                                   │
│  <article data-wb="card" data-title="Hello">Content        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SCHEMA BUILDER v3.0                       │
│  src/core/mvvm/schema-builder.js                           │
│  - Detects wb-* tags or data-wb attributes                 │
│  - Loads schema from wb-models/                            │
│  - Builds DOM from $view structure                         │
│  - Binds $methods to element                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MVVM LAYERS                              │
├─────────────────────────────────────────────────────────────┤
│  MODEL (properties)                                         │
│  - Defines data inputs, types, defaults                    │
│  - Standard JSON Schema format                             │
├─────────────────────────────────────────────────────────────┤
│  VIEW ($view)                                               │
│  - DOM structure with lowercase HTML5 tags                 │
│  - Built from schema, NOT from innerHTML in JS             │
│  - Classes auto-generated: baseClass__name                 │
├─────────────────────────────────────────────────────────────┤
│  VIEWMODEL ($methods + wb-viewmodels/*.js)                 │
│  - Callable functions defined in schema                    │
│  - Implementation in viewmodel files                       │
│  - Bound to element: element.show(), element.hide()        │
└─────────────────────────────────────────────────────────────┘
```

## MVVM Schema Structure

```json
{
  "behavior": "card",
  "baseClass": "wb-card",
  
  "properties": {
    "title":    { "type": "string" },
    "subtitle": { "type": "string" },
    "elevated": { "type": "boolean", "default": false },
    "variant":  { "enum": ["default", "glass", "bordered"] }
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
    "update": { "description": "Updates card properties", "params": ["options"] }
  }
}
```

## Key Principles

### 1. Golden Rule: Attributes Over Slots

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. Users should **never need to know component internals**.

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero title="Explore" subtitle="Your journey" cta="Launch"></wb-hero>

<!-- ❌ UGLY: User must know internal slots -->
<wb-hero>
  <h1 slot="title">Explore</h1>
  <p slot="subtitle">Your journey</p>
  <button slot="cta">Launch</button>
</wb-hero>
```

| Content Type | Use | Example |
|--------------|-----|-------|
| Simple text | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated` |
| Arbitrary rich content | **Body only** | `<wb-card>Any HTML</wb-card>` |

### 2. MVVM Alignment
| Layer | Schema Section | Purpose |
|-------|----------------|---------|
| **M**odel | `properties` | Data inputs |
| **V**iew | `$view` | DOM structure |
| **V**iew**M**odel | `$methods` | Callable functions |

### 3. HTML5 Standards
- Tags are lowercase: `"tag": "header"` not `"tag": "HEADER"`
- Classes auto-generated: `{baseClass}__{name}` → `wb-card__header`

### 4. Detection Triggers (2 only)
```html
<!-- 1. Web component tag -->
<wb-card title="Hello">Content</wb-card>

<!-- 2. Data attribute -->
<article data-wb="card" data-title="Hello">Content</article>
```
~~Class-based detection dropped~~ (classes are for CSS only)

### 5. No innerHTML in JavaScript
```javascript
// ❌ OLD WAY - Don't do this
element.innerHTML = `<div class="card">${title}</div>`;

// ✅ NEW WAY - Schema defines structure
const schema = getSchema('card');
buildFromView(element, schema, data);
bindMethods(element, schema, viewModel);
```

## $view Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `name` | Part identifier → generates class | `"name": "header"` → `.wb-card__header` |
| `tag` | HTML element (lowercase) | `"tag": "header"` |
| `parent` | Nest inside another part | `"parent": "header"` |
| `content` | Template with `{{prop}}` interpolation | `"content": "{{title}}"` |
| `createdWhen` | Conditional creation | `"createdWhen": "title OR subtitle"` |
| `required` | Always create this element | `"required": true` |
| `class` | Additional CSS classes | `"class": "custom-class"` |

## $methods Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `description` | What the method does | `"Shows the card"` |
| `params` | Expected parameters | `["options"]` |
| `returns` | Return type (optional) | `"Promise"` |

## Migration Status

### ✅ Complete
- [x] Schema Builder v3.0 (`src/core/mvvm/schema-builder.js`)
- [x] Schema index (`src/wb-models/index.json`)
- [x] Test page (`src/core/mvvm-test.html`)
- [x] Migration plan (`docs/MVVM-MIGRATION-PLAN.md`)
- [x] card.schema.json → `$view` format
- [x] cardprofile.schema.json → `$view` format

### 🔄 In Progress
- [ ] Convert remaining card schemas to `$view` format
- [ ] Wire schema-builder into main WB.init()
- [ ] Implement $methods binding in viewmodels

### 📋 TODO
- [ ] Migrate all behaviors to use schema-builder
- [ ] Remove innerHTML from wb-viewmodels/*.js
- [ ] Add CSS for all component tags
- [ ] Update documentation
- [ ] Create auto-generated tests from schema

## File Structure

```
src/
├── core/
│   ├── mvvm/
│   │   ├── index.js           # MVVM exports
│   │   └── schema-builder.js  # Core builder v3.0
│   ├── mvvm-test.html         # Test page
│   └── wb.js                  # Main WB
├── wb-models/                  # JSON Schemas (Model + View + Methods)
│   ├── index.json             # Schema index
│   ├── card.schema.json       # ✅ Converted
│   ├── cardprofile.schema.json # ✅ Converted
│   └── ...
├── wb-viewmodels/             # Behavior implementations
│   ├── card.js
│   └── ...
└── styles/                    # CSS
    └── components.css
```

## Testing

1. Start server: `npm start`
2. Open: `http://localhost:3000/src/core/mvvm-test.html`
3. Check console for schema loading
4. Verify DOM structure matches schema
5. Test methods: `document.querySelector('wb-card').show()`

## Auto-Generated Tests

Since props, view, and methods are defined in schema, tests auto-generate:

| Test Type | Input | Expected |
|-----------|-------|----------|
| No props | `<wb-card>` | main only |
| Title | `title="X"` | header + main |
| Variant | `variant="glass"` | has `.wb-card--glass` |
| Method | `card.show()` | card visible |
| Method | `card.hide()` | card hidden |

## Next Steps

1. **Convert remaining schemas** - All card variants to `$view` format
2. **Implement method binding** - Connect $methods to viewmodel implementations
3. **Wire into WB.init()** - Make it part of normal startup
4. **Auto-generate tests** - Read schema, output test cases
