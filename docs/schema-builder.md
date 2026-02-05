# Schema Builder

The Schema Builder is the MVVM core that transforms `<wb-*>` elements into fully-structured components using JSON Schema definitions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INITIALIZATION                           │
│  loadSchemas() → fetch all .schema.json → store in Maps    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME PROCESSING                        │
│  scan() → processElement() → buildStructure() → done        │
└─────────────────────────────────────────────────────────────┘
```

## Performance Design

### Caching Strategy

| Cache | Type | Purpose | Complexity |
|-------|------|---------|------------|
| `schemaRegistry` | `Map<string, Object>` | Parsed schemas (fetch once) | O(1) lookup |
| `tagToSchema` | `Map<string, string>` | Tag → schema name mapping | O(1) lookup |
| `processedElements` | `WeakSet<HTMLElement>` | Prevent double-processing | O(1) check |

### Why It's Fast

**Without caching:**
```
Every <wb-card> → fetch → parse JSON → process
Every <wb-card> → fetch → parse JSON → process  (repeat)
```

**With caching:**
```
Init: fetch all schemas once → store in Maps
Every <wb-card> → Map.get("card") → process  (instant)
```

Additional optimizations:
- `Promise.all` for parallel schema loading at startup
- `WeakSet` for processed elements (auto garbage collection)
- MutationObserver for dynamic content (no polling)

## Data Extraction

When processing an element, data is extracted from attributes and inner content:

```html
<wb-card title="Hello" elevated>Content here</wb-card>
```

Becomes:
```js
{
  title: "Hello",
  elevated: true,
  content: "Content here"  // inner content
}
```

### Content Field

The inner content of an element is captured as `data.content`:

| Field | Purpose |
|-------|---------|
| `content` | Primary - inner content of element |
| `body` | Alias for backwards compatibility |

Use `{{content}}` in schema `$view` definitions:

```json
{
  "$view": [
    { "name": "body", "tag": "main", "required": true, "content": "{{content}}" }
  ]
}
```

## Processing Pipeline

```
INPUT:  <wb-card title="Hello" elevated>Content here</wb-card>

1. scan()           → finds <wb-card> in DOM
2. processElement() → orchestrates the pipeline
3. detectSchema()   → "wb-card" tag → returns "card"
4. getSchema()      → looks up card.schema.json from registry
5. extractData()    → { title: "Hello", elevated: true, content: "Content here" }
6. buildStructure() → applies classes, calls buildFromView()
7. buildFromView()  → creates header, h3, main from $view
8. bindMethods()    → attaches .show(), .hide() to element

OUTPUT:
<wb-card class="wb-card wb-card--elevated">
  <header class="wb-card__header">
    <h3 class="wb-card__title">Hello</h3>
  </header>
  <main class="wb-card__body">Content here</main>
</wb-card>
```

## API

### Exports

```js
import { 
  init,           // Initialize schema builder
  loadSchemas,    // Load schemas from directory
  registerSchema, // Register a single schema
  getSchema,      // Get schema by name or tag
  getWBkeys,      // Get all registered wb-* tag names
  processElement, // Process a single element
  scan,           // Scan DOM for elements
  startObserver   // Start MutationObserver
} from '/src/core/mvvm/schema-builder.js';
```

### getWBkeys()

Returns array of all registered component tag names:

```js
getWBkeys()  // ["wb-card", "wb-button", "wb-modal", ...]
```

Useful for querying all WB elements:

```js
document.querySelectorAll(getWBkeys().join(', '))
```

### Element Methods

After processing, elements have methods bound from `$methods`:

```js
const card = document.querySelector('wb-card');
card.show();           // Shows the card
card.hide();           // Hides the card
card.toggle();         // Toggles visibility
card.update({ title: "New Title" });  // Updates and rebuilds
card.getData();        // Returns current data object
card.getSchema();      // Returns schema definition
```

### ViewModel Access

Each processed element has `_wbViewModel` for advanced access:

```js
element._wbViewModel.data     // Current data
element._wbViewModel.schema   // Schema definition
element._wbViewModel.element  // DOM element reference
```

## Schema Format

```json
{
  "behavior": "card",
  "baseClass": "wb-card",
  "properties": {
    "title": { "type": "string" },
    "elevated": { "type": "boolean", "appliesClass": "wb-card--elevated" }
  },
  "$view": [
    { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
    { "name": "title", "tag": "h3", "parent": "header", "content": "{{title}}" },
    { "name": "body", "tag": "main", "required": true, "content": "{{content}}" }
  ],
  "$methods": {
    "show": { "description": "Shows the card" },
    "hide": { "description": "Hides the card" }
  }
}
```

### $view Part Properties

| Property | Purpose |
|----------|---------|
| `name` | Part identifier → generates class `{baseClass}__{name}` |
| `tag` | HTML element (lowercase per HTML5) |
| `parent` | Nest inside another part |
| `content` | Template with `{{prop}}` interpolation |
| `createdWhen` | Conditional creation (`title OR subtitle`, `title AND icon`) |
| `required` | Always create this element |
| `class` | Additional CSS classes |
| `attributes` | HTML attributes to set |

### Class Auto-Generation

Classes are automatically generated using BEM:

- Base: `{baseClass}` → `wb-card`
- Part: `{baseClass}__{name}` → `wb-card__header`
- Modifier: `{baseClass}--{modifier}` → `wb-card--elevated`
