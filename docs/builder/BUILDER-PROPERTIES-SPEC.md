# WB Builder Properties Panel Specification
> **Version:** 3.0.0  
> **Last Updated:** 2026-01-20  
> **Status:** Active - SPEC COMPLIANCE REQUIRED

## Overview

The Properties Panel is the right-side panel in the WB Builder for editing component properties. This spec defines REQUIRED behaviors that MUST be implemented and tested.

---

## REQUIRED BEHAVIORS (2026-01-20)

### 1. TEXT ELEMENTS MUST HAVE LOREM IPSUM
When adding ANY text element, it MUST have default lorem ipsum content:

| Element | Default Content |
|---------|-----------------|
| `<p>` | "Lorem ipsum dolor sit amet, consectetur adipiscing elit." |
| `<h1>` | "Main Heading Title" |
| `<h2>` | "Section Heading" |
| `<h3>` | "Subsection Heading" |
| `<h4>` | "Minor Heading" |
| `<span>` | "Inline text" |
| `<blockquote>` | "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." |

### 2. PROPERTIES PANEL MUST BE COLUMNAR (VERTICAL)
- Property rows MUST be vertical: label ABOVE input
- NEVER horizontal layout with label beside input
- Each input takes full width of panel

```
CORRECT (Columnar):
┌─────────────────────────┐
│ variant                 │  ← Label
│ [dropdown          ▼]  │  ← Input below
├─────────────────────────┤
│ columns                 │
│ [3                    ] │
└─────────────────────────┘

WRONG (Horizontal):
┌─────────────────────────┐
│ variant [dropdown ▼]    │  ← NO! Side by side
│ columns [3        ]     │
└─────────────────────────┘
```

### 3. TEXT CONTENT MUST AUTO-GROW
- Textarea for text content MUST expand as user types
- Use CSS: `resize: vertical; min-height: 60px;`
- On input: adjust height to scrollHeight

```javascript
oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"
```

### 4. TEXT CONTENT MUST UPDATE LIVE (AS USER TYPES)
- Use `oninput` NOT `onchange` for text content
- Element text updates in real-time while typing
- NO waiting for blur/focus change

```javascript
// CORRECT - Live update
oninput="EditorToolbar.updateElementContent(id, this.value)"

// WRONG - Only on blur
onchange="EditorToolbar.updateElementContent(id, this.value)"
```

### 5. INLINE STYLES ARE OPTIONAL (NOT AUTOMATIC)
- Inline style textarea shows placeholder comment
- Users ADD styles if they want element-level styling
- Default is EMPTY (no automatic styles)

```html
<textarea placeholder="/* Optional: Add inline styles here */
/* e.g. color: red; padding: 1rem; */">
</textarea>
```

### 6. EVERY ELEMENT MUST HAVE THEME SELECTOR
- Theme dropdown at top of properties panel
- Uses WB theme classes
- Default: "inherit" (no theme class)

Available themes:
- Default (inherit) - empty value
- `wb-dark`
- `wb-light`
- `wb-ocean`
- `wb-forest`
- `wb-sunset`
- `wb-midnight`

### 7. +ELEMENT AND +COMPONENT BUTTONS MUST WORK

#### Canvas Toolbar Buttons
The `+ Element` and `+ Component` buttons in the canvas toolbar MUST:
1. Open a dropdown menu when clicked
2. Add the selected item to:
   - Currently selected element (as child), OR
   - End of canvas (if nothing selected)

#### Component Overlay Buttons
Each component's overlay has `+ Element` and `+ Component` buttons that:
1. Open a dropdown menu
2. Add selected item as CHILD of that component

```
Canvas Toolbar:
┌─────────────────────────────────────────────────────────┐
│ Canvas | 0 components | [+ Element ▼] [+ Component ▼]  │
└─────────────────────────────────────────────────────────┘

Component Overlay:
┌─────────────────────────────────────────────────────────┐
│ <div> [+ Element][+ Component][👁️][</>]           [🗑️] │
├─────────────────────────────────────────────────────────┤
│ (component content)                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Panel Structure

```
┌─────────────────────────────────┐
│ 🎯 <element-tag>                │
│ #el-123456789                   │
├─────────────────────────────────┤
│ 🎨 Theme                        │
│ [Default (inherit) ▼]          │
├─────────────────────────────────┤
│ 📐 Layout (if applicable)       │
│ columns                         │
│ [3 ▼]                          │
│ gap                             │
│ [1rem                         ] │
├─────────────────────────────────┤
│ 📋 All Attributes               │
│ id                              │
│ [my-element           ] [×]     │
│ class                           │
│ [my-class             ] [×]     │
├─────────────────────────────────┤
│ ➕ Add Attribute                 │
│ [attribute name               ] │
│ [attribute value              ] │
│ [Add Attribute]                 │
├─────────────────────────────────┤
│ 📝 Text Content                 │
│ ┌─────────────────────────────┐ │
│ │ Lorem ipsum dolor sit amet  │ │
│ │ (auto-grows as you type)    │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🎨 Inline Style (optional)      │
│ ┌─────────────────────────────┐ │
│ │ /* Optional: Add styles */  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Test Requirements

The following tests MUST pass:

### Element Defaults Test
```typescript
test('text elements should have lorem ipsum content', async ({ page }) => {
  // Add a <p> element
  // Verify content contains "Lorem ipsum"
});
```

### Live Update Test
```typescript
test('text content should update as user types', async ({ page }) => {
  // Select element
  // Type in properties panel textarea
  // Verify canvas element updates in real-time
});
```

### Theme Selector Test
```typescript
test('each element should have theme selector', async ({ page }) => {
  // Select element
  // Verify theme dropdown exists
  // Change theme
  // Verify element has theme class
});
```

### Button Functionality Test
```typescript
test('+Element button should add to canvas', async ({ page }) => {
  // Click + Element in canvas toolbar
  // Select element type
  // Verify element added to canvas
});
```

---

## Files

| File | Purpose |
|------|---------|
| `src/builder/builder-editor-toolbar.js` | EditorToolbar class - handles all toolbar actions |
| `src/builder/views/canvas-view.html` | Canvas HTML with toolbar |
| `src/builder/views/properties-panel.html` | Properties panel container |
| `src/styles/builder.css` | Panel styling |
| `tests/behaviors/ui/builder-properties.spec.ts` | Properties panel tests |

---

## CSS Requirements

```css
/* Columnar layout */
.prop-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.prop-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.prop-input,
.prop-select,
.prop-textarea {
  width: 100%;
}

/* Auto-grow textarea */
.prop-textarea-autogrow {
  min-height: 60px;
  resize: vertical;
  overflow-y: hidden;
}
```

---

## API Reference

```javascript
// Insert element to canvas or selected component
EditorToolbar.insertElement('div');
EditorToolbar.insertComponent('wb-card');

// Update element content (live)
EditorToolbar.updateElementContent(wrapperId, text);

// Update element theme
EditorToolbar.updateElementTheme(wrapperId, 'wb-dark');

// Update element attribute
EditorToolbar.updateElementAttr(wrapperId, 'class', 'my-class');

// Update inline style
EditorToolbar.updateElementStyle(wrapperId, 'color: red;');
```

---

## Changelog

### v3.0.0 (2026-01-20)
- Added REQUIRED lorem ipsum for text elements
- Enforced columnar layout for properties panel
- Added live text content updates (oninput)
- Made inline styles optional with placeholder
- Added theme selector to every element
- Fixed +Element and +Component button functionality
