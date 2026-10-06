# Container - wb-starter v3.0

Full-featured layout container that switches between a flex stack/row (1 column) and a responsive auto-fit grid (2+ columns), with configurable gap, alignment, padding, and max-width.

## Overview

| Property | Value |
|----------|-------|
| Attribute form | `<div x-container>` |
| Behavior | `container` |
| Semantic | `<div>` (structural/CSS-only -- no `$methods`; a `semantic/container.schema.json` exists for the plain `<container>` semantic element, not for this behavior) |
| Root CSS Class | `x-container` (`x-container--grid` in grid mode) |
| Category | Layout |

`container()` (`src/wb-viewmodels/layouts.js`) is a plain structural behavior driven entirely by attributes.

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
| `maxWidth` | string | `""` | Optional max-width; when set, also centers via `margin: 0 auto` |

## Usage

### Custom Element (Flex Stack, Default)

<div x-demo>
<div x-container>
  <article title="One">Content</article>
  <article title="Two">Content</article>
</div>
</div>

### Row Direction

<div x-demo>
<div x-container direction="row" gap="0.75rem">
  <button variant="primary">Save</button>
  <button variant="ghost">Cancel</button>
</div>
</div>

### Grid Mode (2+ Columns)

<div x-demo>
<div x-container columns="3" gap="1rem">
  <article title="A">Card A</article>
  <article title="B">Card B</article>
  <article title="C">Card C</article>
</div>
</div>

### Centered, Max-Width

<div x-demo>
<div x-container maxWidth="640px" padding="2rem">
  <p>Centered reading-width content block.</p>
</div>
</div>

### Alignment

<div x-demo>
<div x-container direction="row" justify="space-between" align="center">
  <span>Left</span>
  <span>Right</span>
</div>
</div>

## Generated Structure

`container()` does not add or remove elements, and it writes no inline style. It adds the `x-container` class, plus `x-container--grid` when `columns` is 2 or more; those rules in `src/styles/behaviors/layout.css` carry the defaults. Any value you change from a default (`gap`, `padding`, `align`, `justify`, `direction`, `maxWidth`, or the grid's minimum column width) travels as a generated rule, named by a `data-x-style` token on the host. Children are left untouched. With `columns="2"` the host becomes:

```html-static
<div x-container columns="2" class="x-container x-container--grid" data-x-style="xs…">
  <!-- original children, unmodified -->
</div>
```

## CSS Classes

| Selector | Applied When | Description |
|----------|--------------|--------------|
| `.x-container` | Always | Flex column: `align-items: stretch`, `gap: 1rem`, `padding: 1rem`, wrapping (`layout.css`) |
| `.x-container--grid` | `columns` is 2 or more | `display: grid`, auto-fit columns (`layout.css`) |
| `[x-container].drop-target` | External drag-and-drop code adds `.drop-target` | Success-colored border/background (`effects.css`) |

## Methods

None. `container()` returns a cleanup function that clears its generated rules and removes `x-container--grid`, and attaches no API to the element.

## Events

None. `<div x-container>` dispatches no custom events.

## CSS API

`container()` has no dedicated CSS custom properties -- `gap`/`align`/`justify`/`padding`/`maxWidth` reach the host as a generated rule, not as variables.

| Variable | Used For | Description |
|----------|----------|--------------|
| `--primary` | Hover border color (tag-level CSS) | From `src/styles/behaviors/effects.css` |
| `--success-color` / `--success-bg` | `.drop-target` state (tag-level CSS) | Drag-and-drop target highlight |

## Accessibility

`<div x-container>` is a purely presentational layout container -- it sets no ARIA role or attributes. Give individual children their own accessible names/roles/landmarks as appropriate.
