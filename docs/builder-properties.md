# WB Builder Properties Panel
> **Version:** 2.0.0  
> **Last Updated:** 2026-01-18  
> **Status:** Active
## Overview
The Properties Panel is the right-side panel in the WB Builder that allows users to edit component properties. It provides a **flat, always-visible** view of all editable properties for the selected component.

---

## Design Principles

### 1. FLAT DISPLAY
All categories and their options are **always visible**. No collapsing, no hiding.

### 2. NO SUBMENUS
Categories show their label with options directly below. Never nest options in expandable sections.

### 3. IMMEDIATE FEEDBACK
All changes apply instantly to the canvas. No save button needed.

### 4. DEV MODE
No alerts, prompts, or toasts. Console logging only.

---

## Panel Structure

When a component is selected, the Properties Panel shows **ALL attributes** of the element:

```
┌─────────────────────────────────┐
│ 🧩 <wb-card>                    │  ← Component icon + tag
│ #el-1705612345678               │  ← Wrapper ID
│                                 │
│ Card component description      │  ← From schema
├─────────────────────────────────┤
│ 🎨 Appearance                   │  ← Category (from schema)
│   variant  [default ▼]          │
│   size     [md ▼]               │
├─────────────────────────────────┤
│ 📋 All Attributes               │  ← ALL existing attributes
│   id       [my-card  ] [×]      │  ← Editable + removable
│   class    [featured ] [×]      │
│   data-foo [bar      ] [×]      │
├─────────────────────────────────┤
│ ➕ Add Attribute                 │  ← Add any new attribute
│   [name    ] [value   ] [Add]   │
├─────────────────────────────────┤
│ 📝 Text Content                 │
│   ┌─────────────────────────┐   │
│   │ Card text content here  │   │  ← Textarea
│   └─────────────────────────┘   │
├─────────────────────────────────┤
│ 🎨 Inline Style                 │
│   ┌─────────────────────────┐   │
│   │ color: red; padding...  │   │  ← CSS code
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Key Features

1. **Auto-Generated IDs** - Every element gets a unique ID like `div-1705612345678-a3x9`
2. **Schema Attributes** - WB components show categorized attributes from schema
3. **All Attributes** - Every attribute on the element is shown and editable
4. **Remove Attributes** - Click [×] to remove any attribute
5. **Add Attributes** - Add any custom attribute with name/value inputs
6. **Text Content** - Edit inner text content directly
7. **Inline Style** - Edit CSS directly with monospace textarea

---

## Category Icons

| Icon | Category | Typical Attributes |
|------|----------|-------------------|
| 🎨 | Appearance | variant, size, color, theme |
| 📐 | Layout | columns, gap, width, height, align, justify, direction |
| 🔗 | Media | src, href, url, image, icon, logo |
| 📝 | Content | title, subtitle, label, text, description |
| ⚙️ | State | disabled, readonly, required, checked, expanded |
| 🎯 | Behavior | click, change, hover, trigger |
| 🏷️ | HTML | id, class (standard HTML attributes) |

---

## Input Control Types

| Attribute Type | UI Control | Example |
|----------------|------------|---------|
| Enum (pipe-separated options) | `<select>` dropdown | variant: default\|glass\|bordered |
| Boolean | `<input type="checkbox">` | elevated: true/false |
| Number | `<input type="number">` | columns: 3 |
| Text/CSS value | `<input type="text">` | gap: 1rem |
| Multi-line content | `<textarea>` | Text content |

---

## Attribute Sources

### 1. Hardcoded Fallback (Layout Components)

Components like `wb-grid`, `wb-flex`, `wb-stack` use **plain attributes** (not `data-*`), so they're defined in `WB_COMPONENT_ATTRS`:

```javascript
'wb-grid': {
  description: 'Grid layout',
  categories: {
    '📐 Layout': [
      { name: 'columns', type: 'select', options: ['1','2','3','4','5','6','auto-fit','auto-fill'] },
      { name: 'gap', type: 'text', default: '1rem' },
      { name: 'min-width', type: 'text', default: '200px' }
    ]
  }
}
```

### 2. Schema (custom-elements.json)

Components with `data-*` attributes are read from `data/custom-elements.json`:

```json
{
  "tagName": "wb-card",
  "description": "Card component",
  "attributes": [
    { "name": "data-variant", "type": { "text": "default|glass|bordered|flat" } },
    { "name": "data-elevated", "type": { "text": "boolean" } }
  ]
}
```

---

## Category Auto-Detection

Attributes are automatically categorized by name pattern:

```javascript
function getCategoryForAttribute(attrName) {
  const name = attrName.toLowerCase().replace('data-', '');
  
  if (['variant', 'size', 'color', 'theme'].some(k => name.includes(k))) 
    return '🎨 Appearance';
  if (['columns', 'gap', 'width', 'height', 'align', 'justify'].some(k => name.includes(k))) 
    return '📐 Layout';
  if (['src', 'href', 'url', 'image', 'icon'].some(k => name.includes(k))) 
    return '🔗 Media';
  if (['title', 'subtitle', 'label', 'text', 'content'].some(k => name.includes(k))) 
    return '📝 Content';
  if (['disabled', 'readonly', 'checked', 'expanded'].some(k => name.includes(k))) 
    return '⚙️ State';
  
  return '⚙️ Properties';
}
```

---

## Standard Sections

Every component shows these sections:

### 🏷️ HTML Attributes
Always present. Contains:
- `id` - Element ID
- `class` - CSS classes

### 📝 Content
Present for non-void elements. Contains:
- Textarea for text content

**Skipped for:** `wb-grid`, `wb-flex`, `wb-stack`, `wb-container`, `br`, `hr`, `img`, `input`

---

## API

### Update Attribute
```javascript
EditorToolbar.updateElementAttr(wrapperId, attrName, value);
// Example: EditorToolbar.updateElementAttr('el-123', 'columns', '4');
```

### Update Content
```javascript
EditorToolbar.updateElementContent(wrapperId, textValue);
// Example: EditorToolbar.updateElementContent('el-123', 'New text');
```

### Get Component Attributes
```javascript
const def = getComponentAttributes('wb-card');
// Returns: { description: '...', categories: { '🎨 Appearance': [...] } }
```

---

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.prop-header` | Component name and ID section |
| `.prop-desc` | Component description |
| `.prop-category` | Category container |
| `.prop-category-label` | Category name with icon |
| `.prop-row` | Label + input row |
| `.prop-label` | Attribute name |
| `.prop-input` | Text/number input |
| `.prop-select` | Dropdown select |
| `.prop-textarea` | Multi-line content |

---

## Example Output

### When wb-grid is selected:

```
🧩 <wb-grid>
#el-1705612345678

Grid layout

📐 Layout
  columns    [3 ▼]
  gap        [1rem    ]
  min-width  [200px   ]

🏷️ HTML
  id         [        ]
  class      [        ]
```

### When wb-card is selected:

```
🧩 <wb-card>
#el-1705612345679

Card component

🎨 Appearance
  variant    [default ▼]

📝 Content
  title      [        ]
  subtitle   [        ]

⚙️ State
  elevated   [✓]
  clickable  [ ]

🏷️ HTML
  id         [        ]
  class      [        ]

📝 Content
  [textarea]
```

---

## Files

| File | Purpose |
|------|---------|
| `src/builder/builder-editor-toolbar.js` | Properties panel rendering |
| `src/builder/views/properties-panel.html` | Panel HTML structure |
| `data/custom-elements.json` | Component schema (908KB) |
| `data/propertyconfig.json` | Legacy property definitions |

---

## Integration

The properties panel integrates with:

1. **Canvas Selection** - Updates when user clicks a component
2. **View Mode Toggle** - Works with HTML/Render modes
3. **Real-time Updates** - Changes reflect immediately on canvas
4. **Schema System** - Reads attributes from custom-elements.json
5. **Component Nesting** - Shows parent/child hierarchy

---

## Component Nesting

Each component overlay has **[+ Element]** and **[+ Component]** buttons:

```
┌──────────────────────────────────────────────────────┐
│ <wb-card>  [+ Element][+ Component][👁️][</>]  [🗑️] │
├──────────────────────────────────────────────────────┤
│   ┌──────────────────────────────────────────────┐   │
│   │ <wb-grid>  [+ Element][+ Component]... [🗑️] │   │  ← Child
│   └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Click to Edit

**Click on any component content** to select it. The Properties Panel immediately shows:
- ALL existing attributes (editable + removable)
- Add Attribute section (name/value inputs)
- Text content editor
- Inline style editor

### Benefits

| Benefit | Description |
|---------|-------------|
| **Encapsulation** | Children belong to parent |
| **Hierarchical delete** | Remove parent = remove all children |
| **Visual nesting** | Clear parent/child borders |
| **Tree structure** | Matches DOM hierarchy |

### API

```javascript
// Show add-child menu for a component
EditorToolbar.showAddChildMenu('el-123', buttonElement);

// Add element as child
EditorToolbar.addChildElement('div');

// Add component as child
EditorToolbar.addChildComponent('wb-grid');
```
