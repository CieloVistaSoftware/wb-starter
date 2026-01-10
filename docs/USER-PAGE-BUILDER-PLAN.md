# User Page Builder Plan

## Vision

A drag-and-drop page builder that lets users create professional web pages without writing code. Components are schema-driven, ensuring consistency between what users build and what developers maintain.

---

## Current State

### What Works ✅
- Drag components from sidebar to canvas
- Basic component rendering via Web Behaviors (WB) behaviors
- Viewport switching (desktop/tablet/mobile)
- Notes panel for user annotations
- Component list in right panel
- Sidebar resizing (fixed to 50% max)

### What's Broken ❌
- **Invisible components** — Clipboard, Confetti, Print, Share, Fullscreen drop but show nothing
- **No right-click context menu** — Can't quickly edit/delete/duplicate
- **Container has no layout control** — No columns, gap, direction properties
- **Property panel incomplete** — Many components missing editable properties
- **No schema integration** — Builder doesn't read from `*.schema.json` files
- **Card inheritance broken** — Card variants don't properly inherit base properties
- **No undo/redo** — Destructive actions can't be reversed
- **No save/load** — Pages are lost on refresh

---

## Architecture Principles

### 1. Schema-Driven Everything
```
*.schema.json → Builder UI → Properties Panel → Rendered Component
```

Every component's:
- Properties come from schema
- Default values come from schema
- Validation rules come from schema
- Property types (text/checkbox/dropdown) come from schema

### 2. IS-A / HAS-A Inheritance
```
cardbutton IS-A card → inherits title, subtitle, footer, elevated, clickable
cardbutton HAS-A buttons → has primary, secondary, primaryHref, secondaryHref
```

### 3. Canvas-Editable vs Panel-Editable
| Type | Interaction | Examples |
|------|-------------|----------|
| **Canvas-editable** | Double-click on canvas | title, subtitle, content, footer |
| **Panel-editable** | Properties panel | elevated, clickable, variant, size |

### 4. Component Categories
```
Layout:     Container, Grid, Columns, Spacer
Content:    Card*, Alert, Badge, Avatar, Skeleton
Media:      Image, Video, Audio, Carousel
Forms:      Input, Textarea, Select, Checkbox, Switch, Rating
Navigation: Tabs, Accordion, Breadcrumb, Pagination
Feedback:   Toast, Modal, Tooltip, Progress, Spinner
Actions:    Button, Clipboard, Share, Print, Fullscreen
Effects:    Animate, Confetti, Ripple, Parallax
```

---

## Phase 1: Foundation Fixes (Current Sprint)

### 1.1 Fix Invisible Components
Make these components render something visible when dropped:

| Component | Fix |
|-----------|-----|
| Clipboard | Render button: "📋 Copy to Clipboard" |
| Confetti | Render button: "🎉 Fire Confetti!" |
| Print | Render button: "🖨️ Print Page" |
| Share | Render button: "📤 Share" |
| Fullscreen | Render button: "⛶ Fullscreen" |
| Scroll | Render button: "↓ Scroll to..." |

**Files:** `src/behaviors/js/enhancements.js`, `src/behaviors/js/effects.js`

### 1.2 Add Context Menu
Right-click on any dropped component shows:
```
📋 View Schema
⚙️ Edit Properties
─────────────────
📄 Duplicate
⬆️ Move Up
⬇️ Move Down
─────────────────
🗑️ Delete
```

**File:** `builder.js` (add ~50 lines)

### 1.3 Fix Container Layout
Add properties to Container component:
```javascript
{ n: 'Container', i: '📦', b: 'container', d: {
  direction: 'column',    // column | row
  columns: 1,             // 1 = flex, 2+ = grid
  gap: '1rem',            // CSS gap
  padding: '1rem',        // CSS padding
  align: 'stretch',       // flex align-items
  justify: 'start',       // flex justify-content
  wrap: true              // flex-wrap
}, container: true }
```

**File:** `builder.js` (C.All definition)

### 1.4 Add Undo/Redo Stack
```javascript
const history = {
  past: [],      // Previous states
  present: null, // Current state
  future: []     // Redo states
};

function saveState() {
  history.past.push(JSON.stringify(history.present));
  history.present = getCanvasState();
  history.future = [];
}

window.undo = () => { /* pop from past, push to future */ };
window.redo = () => { /* pop from future, push to past */ };

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') { e.shiftKey ? redo() : undo(); }
});
```

### 1.5 Schema-First Refactor (Card Component)
Refactor `card.js` to follow MVVM/Enhancer pattern and new directory structure:
- **Directory Structure**: Move logic to `src/wb-viewmodels/`, templates to `src/wb-views/`, and schemas to `src/wb-models/`.
- **Decouple Validation**: Allow any Custom Element (hyphenated) or standard container.
- **Enhancer Mode**: Bind to existing DOM structure instead of overwriting it.
- **Builder Mode**: Only inject elements if structure is missing.

---

## Phase 2: Schema Integration

### 2.1 Load Schema on Component Drop
```javascript
async function getSchemaProperties(behavior) {
  try {
    const res = await fetch(`/src/behaviors/schema/${behavior}.schema.json`);
    const schema = await res.json();
    return schema.properties || {};
  } catch {
    return {};
  }
}

// When component dropped:
const schemaProps = await getSchemaProperties(component.b);
const mergedProps = { ...schemaProps, ...component.d };
```

### 2.2 Generate Property Panel from Schema
```javascript
function renderPropertyInput(propName, propDef, currentValue) {
  const { type, enum: options, description, default: def } = propDef;
  
  if (type === 'boolean') {
    return `<label><input type="checkbox" ${currentValue ? 'checked' : ''}> ${propName}</label>`;
  }
  if (options) {
    return `<select>${options.map(o => `<option ${o === currentValue ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  }
  if (propDef.inputType === 'textarea') {
    return `<textarea>${currentValue}</textarea>`;
  }
  return `<input type="text" value="${currentValue || def || ''}">`;
}
```

### 2.3 Validate on Property Change
```javascript
function validateProperty(propName, value, schema) {
  const def = schema.properties[propName];
  if (!def) return { valid: true };
  
  if (def.enum && !def.enum.includes(value)) {
    return { valid: false, error: `Must be one of: ${def.enum.join(', ')}` };
  }
  if (def.minimum !== undefined && Number(value) < def.minimum) {
    return { valid: false, error: `Minimum: ${def.minimum}` };
  }
  // etc.
  return { valid: true };
}
```

---

## Phase 3: Save/Load/Export

### 3.1 Page State Format
```json
{
  "version": "1.0",
  "meta": {
    "title": "My Landing Page",
    "created": "2025-12-18T00:00:00Z",
    "modified": "2025-12-18T00:00:00Z"
  },
  "components": [
    {
      "id": "comp_1",
      "behavior": "cardhero",
      "props": { "title": "Welcome", "subtitle": "Build faster" },
      "children": []
    },
    {
      "id": "comp_2",
      "behavior": "container",
      "props": { "columns": 3, "gap": "2rem" },
      "children": ["comp_3", "comp_4", "comp_5"]
    }
  ]
}
```

### 3.2 Save to Server
```javascript
async function savePage(name) {
  const state = {
    version: '1.0',
    meta: { title: name, modified: new Date().toISOString() },
    components: getCanvasState()
  };
  
  await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: `data/pages/${name}.json`, data: state })
  });
}
```

### 3.3 Export to HTML
```javascript
function exportToHTML() {
  const canvas = document.getElementById('canvas');
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <title>Exported Page</title>
  <link rel="stylesheet" href="src/styles/themes.css">
  <link rel="stylesheet" href="styles/site.css">
</head>
<body>
  ${canvas.innerHTML}
  <script type="module" src="src/wb.js"></script>
</body>
</html>`;
  
  downloadFile('page.html', html);
}
```

---

## Phase 4: Advanced Features

### 4.1 Component Templates
Pre-built combinations:
- **Hero Section** — cardhero + container with 3 cards
- **Pricing Table** — container with 3 cardpricing
- **Testimonials** — container with cardtestimonial cards
- **Contact Form** — container with input, textarea, button

### 4.2 Responsive Settings
Per-component breakpoint overrides:
```json
{
  "behavior": "container",
  "props": { "columns": 3 },
  "responsive": {
    "tablet": { "columns": 2 },
    "mobile": { "columns": 1 }
  }
}
```

### 4.3 Style Editor
Custom CSS per component:
- Background color/image
- Border radius/color
- Padding/margin
- Typography overrides

### 4.4 Layers Panel
Visual hierarchy view:
```
📦 Container
  ├── 🃏 Card Hero
  ├── 📦 Container (3 cols)
  │   ├── 🃏 Card
  │   ├── 🃏 Card
  │   └── 🃏 Card
  └── 🔘 Button
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/wb-models/` | New directory for JSON Schemas |
| `src/wb-views/` | Renamed from `src/parts/` (HTML Templates) |
| `src/wb-viewmodels/` | Renamed from `src/behaviors/js/` (JS Logic) |
| `builder.js` | Context menu, undo/redo, schema loading, save/load |
| `builder.css` | Context menu styles, layers panel |
| `builder.html` | Layers panel markup, toolbar buttons |
| `src/wb-viewmodels/enhancements.js` | Fix invisible action components |
| `src/wb-viewmodels/effects.js` | Fix confetti visibility |
| `C.All` definitions | Add missing properties, fix Container |

---

## Execution Order

### Week 1: Foundation
1. ✅ Fix sidebar resize (done)
2. ✅ Refactor Event Handling (Attach/Detach pattern) (done)
3. ⬜ Fix invisible components (6 components)
4. ⬜ Add context menu
5. ⬜ Fix Container layout properties

### Week 2: Schema Integration
5. ⬜ Load schemas on drop
6. ⬜ Generate property panel from schema
7. ⬜ Add property validation

### Week 3: Persistence
8. ⬜ Implement undo/redo
9. ⬜ Save page to JSON
10. ⬜ Load page from JSON
11. ⬜ Export to HTML

### Week 4: Polish
12. ⬜ Component templates
13. ⬜ Layers panel
14. ⬜ Keyboard shortcuts reference
15. ⬜ Documentation

---

## Success Criteria

- [ ] All 41+ components render visibly when dropped
- [ ] Right-click context menu works on all components
- [ ] Properties panel shows ALL schema properties
- [ ] Changes persist across page refresh
- [ ] Can export working HTML page
- [ ] Undo/redo works (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Container supports grid layouts (1-12 columns)

---

*Created: December 18, 2025*
*Status: Planning*
