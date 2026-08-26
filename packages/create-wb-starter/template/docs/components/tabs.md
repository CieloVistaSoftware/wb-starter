# Tabs Component Documentation
[Edit this file](./tabs.md)

## Overview
The Tabs component provides a flexible tabbed interface for organizing content into switchable panels. It uses semantic HTML with proper accessibility features and keyboard navigation.

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-tabs>
  <div tab="Tab 1">Content 1</div>
  <div tab="Tab 2">Content 2</div>
  <div tab="Tab 3">Content 3</div>
</div>
</div>

---

## Usage

### Simple Tabs
```html
<div x-tabs>
  <div tab="Tab 1">Content 1</div>
  <div tab="Tab 2">Content 2</div>
  <div tab="Tab 3">Content 3</div>
</div>
```

### Basic Usage
```html
<div x-tabs>
  <div tab="Overview">
    <h3>Overview Content</h3>
    <p>Overview details...</p>
  </div>
  <div tab="Details">
    <h3>Details Content</h3>
    <p>More information...</p>
  </div>
  <div tab="Settings">
    <h3>Settings</h3>
    <p>Configuration options...</p>
  </div>
</div>
```

### With Active Tab
```html
<div x-tabs active-tab="1">
  <div tab="Home">Welcome content</div>
  <div tab="About">About us</div>
  <div tab="Contact">Contact info</div>
</div>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active-tab` | number | 0 | Index of initially active tab (0-based) |
| `orientation` | string | "horizontal" | Layout direction: `horizontal` or `vertical` |

---

## Events

### wb:tabs:change
Fired when the active tab changes.

**Detail properties:**
- `index` (number): The index of the newly active tab
- `label` (string): The label of the newly active tab
- `previousIndex` (number): The index of the previously active tab

```javascript
document.addEventListener('wb:tabs:change', (e) => {
  console.log('Switched to tab:', e.detail.label, 'at index:', e.detail.index);
});
```

---

## Methods

### Public API
```javascript
const tabs = document.querySelector('x-tabs');

// Switch to tab by index (0-based)
tabs.setActiveTab(2);

// Get current active tab index
const activeIndex = tabs.getActiveTab();

// Get tab labels
const labels = tabs.getTabLabels();

// Get total number of tabs
const count = tabs.getTabCount();
```

---

## Accessibility

The component automatically provides:

- **Semantic HTML**: Uses `<nav>` for tab list and `<section>` for panels
- **ARIA Roles**: `tablist`, `tab`, `tabpanel` roles
- **ARIA States**: `aria-selected`, `aria-controls`, `aria-labelledby`
- **Keyboard Navigation**: Arrow keys, Home, End keys
- **Focus Management**: Proper tab order and focus indicators

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `←` `→` | Navigate between tabs (horizontal) |
| `↑` `↓` | Navigate between tabs (vertical) |
| `Home` | First tab |
| `End` | Last tab |
| `Enter` `Space` | Activate focused tab |

---

## Semantic Structure

```html
<section class="x-tabs">
  <!-- Tab Navigation -->
  <nav
    class="x-tabs__nav"
    role="tablist"
    aria-orientation="horizontal">
    <button
      class="x-tabs__tab x-tabs__tab--active"
      role="tab"
      aria-selected="true"
      aria-controls="x-tabs-panel-0"
      id="x-tabs-tab-0">
      Tab 1
    </button>
    <button
      class="x-tabs__tab"
      role="tab"
      aria-selected="false"
      aria-controls="x-tabs-panel-1"
      id="x-tabs-tab-1">
      Tab 2
    </button>
  </nav>
  <!-- Tab Panels -->
  <div class="x-tabs__panels">
    <section
      class="x-tabs__panel x-tabs__panel--active"
      role="tabpanel"
      aria-labelledby="x-tabs-tab-0"
      id="x-tabs-panel-0">
      Content for Tab 1
    </section>
    <section
      class="x-tabs__panel"
      role="tabpanel"
      aria-labelledby="x-tabs-tab-1"
      id="x-tabs-panel-1"
      hidden>
      Content for Tab 2
    </section>
  </div>
</section>
```

---

## Styling

### CSS Custom Properties
```css
x-tabs {
  /* Layout */
  --tabs-orientation: horizontal;
  --tabs-gap: var(--space-md);

  /* Colors */
  --tabs-bg: var(--bg-secondary);
  --tabs-border: var(--border-color);
  --tabs-text: var(--text-primary);
  --tabs-text-muted: var(--text-muted);

  /* Active states */
  --tabs-active-bg: var(--accent-color);
  --tabs-active-text: var(--text-on-accent);
  --tabs-active-border: var(--accent-color);

  /* Focus states */
  --tabs-focus-outline: 2px solid var(--accent-color);
  --tabs-focus-outline-offset: 2px;

  /* Transitions */
  --tabs-transition: all 0.2s ease;
}
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.x-tabs` | Main container |
| `.x-tabs__nav` | Tab navigation container |
| `.x-tabs__tab` | Individual tab button |
| `.x-tabs__tab--active` | Currently active tab |
| `.x-tabs__tab--disabled` | Disabled tab |
| `.x-tabs__panels` | Panels container |
| `.x-tabs__panel` | Individual panel |
| `.x-tabs__panel--active` | Currently active panel |
| `.x-tabs--vertical` | Vertical orientation modifier |

---

## Schema
- See: [src/wb-models/tabs.schema.json](../../src/wb-models/tabs.schema.json)
- Defines component properties, accessibility features, and test scenarios

---

## Implementation
- **Custom Element**: [src/wb-viewmodels/x-tabs.js](../../src/wb-viewmodels/tabs.js)
- **Behavior**: [src/wb-viewmodels/tabs.js](../../src/wb-viewmodels/tabs.js)
- **Styles**: src/styles/components/tabs.css
- **Tests**: Component tests located in `tests/behaviors/ui/tabs.spec.ts`
