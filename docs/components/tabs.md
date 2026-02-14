# Tabs Component Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/tabs.md)

## Overview
The Tabs component provides a flexible tabbed interface for organizing content into switchable panels. It uses semantic HTML with proper accessibility features and keyboard navigation.

---

## Usage

### Simple Tabs
```html
<wb-tabs>
  <div data-tab="Tab 1">Content 1</div>
  <div data-tab="Tab 2">Content 2</div>
  <div data-tab="Tab 3">Content 3</div>
</wb-tabs>
```

### Basic Usage
```html
<wb-tabs>
  <div data-tab="Overview">
    <h3>Overview Content</h3>
    <p>Overview details...</p>
  </div>
  <div data-tab="Details">
    <h3>Details Content</h3>
    <p>More information...</p>
  </div>
  <div data-tab="Settings">
    <h3>Settings</h3>
    <p>Configuration options...</p>
  </div>
</wb-tabs>
```

### With Active Tab
```html
<wb-tabs active-tab="1">
  <div data-tab="Home">Welcome content</div>
  <div data-tab="About">About us</div>
  <div data-tab="Contact">Contact info</div>
</wb-tabs>
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
const tabs = document.querySelector('wb-tabs');

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
<section class="wb-tabs">
  <!-- Tab Navigation -->
  <nav class="wb-tabs__nav" role="tablist" aria-orientation="horizontal">
    <button class="wb-tabs__tab wb-tabs__tab--active"
            role="tab"
            aria-selected="true"
            aria-controls="wb-tabs-panel-0"
            id="wb-tabs-tab-0">
      Tab 1
    </button>
    <button class="wb-tabs__tab"
            role="tab"
            aria-selected="false"
            aria-controls="wb-tabs-panel-1"
            id="wb-tabs-tab-1">
      Tab 2
    </button>
  </nav>

  <!-- Tab Panels -->
  <div class="wb-tabs__panels">
    <section class="wb-tabs__panel wb-tabs__panel--active"
             role="tabpanel"
             aria-labelledby="wb-tabs-tab-0"
             id="wb-tabs-panel-0">
      Content for Tab 1
    </section>
    <section class="wb-tabs__panel"
             role="tabpanel"
             aria-labelledby="wb-tabs-tab-1"
             id="wb-tabs-panel-1"
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
wb-tabs {
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
| `.wb-tabs` | Main container |
| `.wb-tabs__nav` | Tab navigation container |
| `.wb-tabs__tab` | Individual tab button |
| `.wb-tabs__tab--active` | Currently active tab |
| `.wb-tabs__tab--disabled` | Disabled tab |
| `.wb-tabs__panels` | Panels container |
| `.wb-tabs__panel` | Individual panel |
| `.wb-tabs__panel--active` | Currently active panel |
| `.wb-tabs--vertical` | Vertical orientation modifier |

---

## Schema
- See: [src/wb-models/tabs.schema.json](../src/wb-models/tabs.schema.json)
- Defines component properties, accessibility features, and test scenarios

---

## Implementation
- **Custom Element**: [src/wb-viewmodels/wb-tabs.js](../src/wb-viewmodels/wb-tabs.js)
- **Behavior**: [src/wb-viewmodels/tabs.js](../src/wb-viewmodels/tabs.js)
- **Styles**: [src/styles/components/tabs.css](../src/styles/components/tabs.css)
- **Tests**: Component tests located in `tests/behaviors/ui/tabs.spec.ts`
