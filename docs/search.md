# Search Component Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/search.md)

## Overview
The Search component provides a complete search interface with debounced input, keyboard navigation, and interactive result handling. It combines the `x-search` behavior with a custom element wrapper for enhanced functionality and styling.

---

## Variants
The search component supports multiple visual variants and sizes for different use cases:

| Variant | Description | Use Case |
|---------|-------------|----------|
| **default** | Standard search with border | General purpose search |
| **glass** | Semi-transparent background | Modern, overlay interfaces |
| **minimal** | Borderless, subtle styling | Inline search fields |

### Sizes
- `small` - Compact search for tight spaces
- `medium` - Standard size (default)
- `large` - Prominent search for main interfaces

---

## Usage

### Basic Usage
```html
<wb-search placeholder="Search for content..."></wb-search>
```

### With Variants and Sizes
```html
<wb-search
  placeholder="Search tutorials..."
  variant="glass"
  size="large"
  debounce="300">
</wb-search>
```

### Listening for Search Events
```javascript
// Listen for search queries
document.addEventListener('wb:search', (e) => {
  const { query, instant } = e.detail;
  // Perform search logic
});

// Listen for search actions (result clicks)
document.addEventListener('wb:search:action', (e) => {
  const { action, item, url } = e.detail;
  // Handle user actions
});

// Listen for keyboard navigation
document.addEventListener('wb:search:navigate', (e) => {
  const { direction } = e.detail; // 'up' or 'down'
  // Update result selection
});

document.addEventListener('wb:search:select', () => {
  // User pressed Enter on selected result
});

document.addEventListener('wb:search:escape', () => {
  // User pressed Escape
});
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `placeholder` | string | "Search..." | Input placeholder text |
| `variant` | string | "default" | Visual style: `default`, `glass`, `minimal` |
| `size` | string | "medium" | Size variant: `small`, `medium`, `large` |
| `debounce` | number | 300 | Debounce delay in milliseconds |
| `disabled` | boolean | false | Disable the search input |
| `loading` | boolean | false | Show loading state |

---

## Events

### wb:search
Fired when user types in search input (debounced).

**Detail properties:**
- `query` (string): The search query
- `instant` (boolean): True for instant searches (no debounce)

### wb:search:action
Fired when user interacts with search results.

**Detail properties:**
- `action` (string): Action type (`view`, `bookmark`, etc.)
- `item` (object): The result item data
- `url` (string): Associated URL if applicable

### wb:search:navigate
Fired for keyboard navigation in results.

**Detail properties:**
- `direction` (string): Navigation direction (`up` or `down`)

### wb:search:select
Fired when user presses Enter on a selected result.

### wb:search:escape
Fired when user presses Escape key.

### wb:search:clear
Fired when search is cleared.

---

## Methods

### Public API
```javascript
const search = document.querySelector('wb-search');

// Get current value
const value = search.value;

// Set search value programmatically
search.value = 'new query';

// Clear search
search.clear();

// Focus the input
search.focus();

// Set loading state
search.setLoading(true);

// Check if loading
const isLoading = search.loading;
```

---

## Styling

### CSS Custom Properties
```css
wb-search {
  /* Size variants */
  --search-height-small: 2rem;
  --search-height-medium: 2.5rem;
  --search-height-large: 3rem;

  /* Border radius */
  --search-radius: 6px;

  /* Colors */
  --search-bg: var(--bg-secondary);
  --search-border: var(--border-color);
  --search-text: var(--text-primary);
  --search-placeholder: var(--text-muted);

  /* Focus states */
  --search-focus-border: var(--accent-color);
  --search-focus-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);

  /* Loading indicator */
  --search-loading-color: var(--accent-color);
}
```

### Variant-specific Classes
- `.wb-search--glass` - Glass variant styling
- `.wb-search--minimal` - Minimal variant styling
- `.wb-search--small` - Small size styling
- `.wb-search--large` - Large size styling

---

## Schema
- See: [src/wb-models/search.schema.json](../src/wb-models/search.schema.json)
- Defines component properties, variants, and test scenarios

---

## Implementation
- **Custom Element**: [src/wb-viewmodels/wb-search.js](../src/wb-viewmodels/wb-search.js)
- **Behavior**: [src/wb-viewmodels/search.js](../src/wb-viewmodels/search.js)
- **Styles**: [src/styles/components/search.css](../src/styles/components/search.css)
- **Tests**: Component tests located in `tests/behaviors/ui/search.spec.ts`

---

## Demo
See the interactive demo: [demo-search.html](../demo-search.html)

This demo showcases:
- Real-time search with sample data
- Keyboard navigation (↑↓ arrows, Enter, Escape)
- Clickable result actions
- Custom event handling
- Multiple variants and sizes