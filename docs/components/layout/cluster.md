# Cluster - wb-starter v3.0

Horizontal, wrapping flex layout for groups of items that don't need to align to a strict grid (tags, buttons, pills, filter chips).

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cluster>` |
| Behavior | `cluster` |
| Semantic | `<div>` (structural/CSS-only -- no schema, no `$methods`/`$view`) |
| Root CSS Class | *(none -- purely inline-style driven; see below)* |
| Category | Layout |

`cluster()` (`src/wb-viewmodels/layouts.js`) is a plain structural behavior: it reads its config from attributes/`data-*` and applies the result as inline styles on the element. There is no `cluster.schema.json` and no dedicated `cluster.css` -- everything below comes directly from the behavior function.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `gap` | string | `"1rem"` | Gap between items (any CSS length) |
| `justify` | string | `"flex-start"` | `justify-content` value (`flex-start`, `center`, `space-between`, ...) |
| `align` | string | `"center"` | `align-items` value (`center`, `flex-start`, `stretch`, ...) |

## Usage

### Custom Element

<wb-demo>
<div x-cluster>
  <wb-badge label="JavaScript"></div>
  <wb-badge label="CSS"></div>
  <wb-badge label="HTML"></div>
</div>
</wb-demo>

### Custom Gap

```html
<wb-cluster gap="0.5rem">
  <wb-button size="sm" variant="ghost">Filter A</button>
  <wb-button size="sm" variant="ghost">Filter B</button>
  <wb-button size="sm" variant="ghost">Filter C</button>
</div>
```

### Justify Content

```html
<wb-cluster justify="space-between">
  <wb-badge label="Left"></div>
  <wb-badge label="Right"></div>
</div>
```

### Native `<div>` (Enhanced)

```html
<!-- x-cluster works on any element -->
<div x-cluster gap="0.75rem" justify="center">
  <wb-badge label="One"></div>
  <wb-badge label="Two"></div>
</div>
```

## Generated Structure

`cluster()` does not add or remove any elements -- it applies inline styles directly to the host and leaves its children untouched:

```html
<wb-cluster
  style="display:flex;
         flex-wrap:wrap;
         gap:1rem;
         justify-content:flex-start;
         align-items:center;">
  <!-- original children, unmodified -->
</div>
```

## CSS Classes

`cluster()` adds no CSS classes at all -- layout is applied entirely via inline `element.style` properties (`display: flex`, `flex-wrap: wrap`, `gap`, `justify-content`, `align-items`), so there is no `.wb-cluster` class or dedicated stylesheet to override via CSS specificity. Use the `gap`/`justify`/`align` attributes, or override `element.style` directly, to customize a given instance.

## Methods

None. `cluster()` returns a no-op cleanup function and attaches no API to the element.

## Events

None. `<div x-cluster>` dispatches no custom events.

## CSS API

`cluster()` has no dedicated CSS custom properties -- every value (`gap`, `justify-content`, `align-items`) is set directly from the `gap`/`justify`/`align` attributes as inline styles, not through themeable CSS variables.

## Accessibility

`<div x-cluster>` is a purely presentational grouping container -- it sets no ARIA role or attributes and does not affect the accessibility tree beyond the visual layout of its children. Give individual cluster items their own accessible names/roles as appropriate for what they are (buttons, badges, links, etc.).
