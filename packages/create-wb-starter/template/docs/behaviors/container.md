# Container - wb-starter v3.0

Full-featured layout container that switches between a flex stack/row (1 column) and a responsive auto-fit grid (2+ columns), with configurable gap, alignment, padding, and max-width.

## Overview

| Property | Value |
|----------|-------|
| Attribute form | `<div x-container>` |
| Behavior | `container` |
| Semantic | `<div>` (structural/CSS-only -- no `$methods`; a `semantic/container.schema.json` exists for the plain `<container>` semantic element, not for this behavior) |
| Root CSS Class | *(none -- purely inline-style driven; see below)* |
| Category | Layout |

`container()` (`src/wb-viewmodels/layouts.js`) is a plain structural behavior driven entirely by attributes, applied as inline styles.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | string | `"column"` | `column` (stack) or `row` -- only used when `columns` is `1` |
| `columns` | number | `1` | `1` = flex mode (stack/row); `2`+ = responsive auto-fit grid mode |
| `gap` | string | `"1rem"` | Gap between children |
| `align` | string | `"stretch"` | `start`, `center`, `end`, `stretch` |
| `justify` | string | `"start"` | `start`, `center`, `end`, `space-between`, `space-around`, `space-evenly` |
| `wrap` | boolean | `true` | Whether flex-mode children wrap (`false` forces `nowrap`) |
| `padding` | string | `"1rem"` | Padding on the container itself |
| `max-width` | string | `""` | Optional max-width; when set, also centers via `margin: 0 auto` |

## Usage

### Custom Element (Flex Stack, Default)

<div x-demo>
<div x-container>
  <article title="One">Content</article>
  <article title="Two">Content</article>
</div>
</div>

### Row Direction

```html
<div x-container direction="row" gap="0.75rem">
  <button variant="primary">Save</button>
  <button variant="ghost">Cancel</button>
</div>
```

### Grid Mode (2+ Columns)

```html
<div x-container columns="3" gap="1rem">
  <article title="A">Card A</article>
  <article title="B">Card B</article>
  <article title="C">Card C</article>
</div>
```

### Centered, Max-Width

```html
<div x-container max-width="640px" padding="2rem">
  <p>Centered reading-width content block.</p>
</div>
```

### Alignment

```html
<div x-container direction="row" justify="space-between" align="center">
  <span>Left</span>
  <span>Right</span>
</div>
```

## Generated Structure

`container()` does not add or remove elements -- it applies inline styles directly to the host and leaves its children untouched:

```html
<!-- columns > 1: grid mode -->
<div x-container
  style="display:grid;
         grid-template-columns:repeat(auto-fit, minmax(min(250px, 100%), 1fr));
         align-items:stretch;
         justify-content:flex-start;
         gap:1rem;
         padding:1rem;">
  <!-- original children, unmodified -->
</div>
```

## CSS Classes

`container()` adds no CSS classes -- layout is applied entirely via inline styles (`display`, `flex-direction`/`grid-template-columns`, `gap`, `align-items`, `justify-content`, `padding`, `max-width`). The `x-container` **tag** itself has a small base rule in `src/styles/behaviors/effects.css` (`position: relative`, a hover border-color transition, and a `.drop-target` state for drag-and-drop) -- but no class is ever added by the behavior.

| Selector | Applied When | Description |
|----------|--------------|--------------|
| `x-container` (tag selector) | Always | `position: relative`, hover border-color transition |
| `x-container.drop-target` | External drag-and-drop code adds `.drop-target` | Success-colored border/background |

## Methods

None. `container()` returns a cleanup function that clears `element.style.cssText` entirely, and attaches no API to the element.

## Events

None. `<div x-container>` dispatches no custom events.

## CSS API

`container()` has no dedicated CSS custom properties -- `gap`/`align`/`justify`/`padding`/`max-width` are all set directly from attributes as inline styles.

| Variable | Used For | Description |
|----------|----------|--------------|
| `--primary` | Hover border color (tag-level CSS) | From `src/styles/behaviors/effects.css` |
| `--success-color` / `--success-bg` | `.drop-target` state (tag-level CSS) | Drag-and-drop target highlight |

## Accessibility

`<div x-container>` is a purely presentational layout container -- it sets no ARIA role or attributes. Give individual children their own accessible names/roles/landmarks as appropriate.
