# Flex - wb-starter v3.0

A simple, direct Flexbox layout primitive -- direction, wrap, justify, align, and gap, all as attributes.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-flex>` (also `<div x-flex>`) |
| Behavior | `flex` |
| Semantic | `<div>` (structural/CSS-only -- no schema, no `$methods`/`$view`) |
| Root CSS Class | `x-flex` |
| Category | Layout |

`flex()` (`src/wb-viewmodels/layouts.js`) is a plain structural behavior driven entirely by attributes, applied as inline styles plus one marker class.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | string | `"row"` | `flex-direction` value (`row`, `column`, `row-reverse`, `column-reverse`) |
| `wrap` | string | `"wrap"` | `flex-wrap` value (`wrap`, `nowrap`, `wrap-reverse`) |
| `justify` | string | `"flex-start"` | `justify-content` value |
| `align` | string | `"stretch"` | `align-items` value |
| `gap` | string | `"1rem"` | Gap between children |

## Usage

### Custom Element

<div x-demo>
<div x-flex>
  <span x-badge label="One"></span>
  <span x-badge label="Two"></span>
  <span x-badge label="Three"></span>
</div>
</div>

### Column Direction

```html
<div x-flex direction="column" gap="0.5rem">
  <button variant="primary">Top</button>
  <button variant="ghost">Bottom</button>
</div>
```

### Justify and Align

```html
<div x-flex justify="space-between" align="center">
  <span>Left</span>
  <span>Right</span>
</div>
```

### No Wrap

```html
<div x-flex wrap="nowrap" gap="0.5rem">
  <span x-badge label="Stays"></span>
  <span x-badge label="On"></span>
  <span x-badge label="One Line"></span>
</div>
```

### Native `<div>` (Enhanced)

```html
<!-- x-flex works on any element -->
<div x-flex direction="row" gap="0.75rem">
  <span x-badge label="A"></span>
  <span x-badge label="B"></span>
</div>
```

## Generated Structure

`flex()` does not add or remove elements -- it adds one class and applies inline styles directly to the host, leaving children untouched:

```html
<div x-flex
  class="x-flex"
  style="display:flex;
         flex-direction:row;
         flex-wrap:wrap;
         justify-content:flex-start;
         align-items:stretch;
         gap:1rem;">
  <!-- original children, unmodified -->
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.x-flex` | Always | Marker class added by `flex()`; carries no CSS rules of its own in the current stylesheets -- layout comes entirely from the inline styles set alongside it |

## Methods

None. `flex()` returns a cleanup function that removes `.x-flex`, and attaches no API to the element.

## Events

None. `<div x-flex>` dispatches no custom events.

## CSS API

`flex()` has no dedicated CSS custom properties -- `direction`/`wrap`/`justify`/`align`/`gap` are all set directly from attributes as inline styles, not through themeable CSS variables.

## Accessibility

`<div x-flex>` is a purely presentational layout container -- it sets no ARIA role or attributes. Give individual children their own accessible names/roles as appropriate.
