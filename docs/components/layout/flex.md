# Flex - wb-starter v3.0

A simple, direct Flexbox layout primitive -- direction, wrap, justify, align, and gap, all as attributes.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-flex>` (also `<div x-flex>`) |
| Behavior | `flex` |
| Semantic | `<div>` (structural/CSS-only -- no schema, no `$methods`/`$view`) |
| Root CSS Class | `wb-flex` |
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

<wb-demo>
<wb-flex>
  <wb-badge label="One"></div>
  <wb-badge label="Two"></div>
  <wb-badge label="Three"></div>
</wb-flex>
</wb-demo>

### Column Direction

```html
<wb-flex direction="column" gap="0.5rem">
  <wb-button variant="primary">Top</button>
  <wb-button variant="ghost">Bottom</button>
</wb-flex>
```

### Justify and Align

```html
<wb-flex justify="space-between" align="center">
  <span>Left</span>
  <span>Right</span>
</wb-flex>
```

### No Wrap

```html
<wb-flex wrap="nowrap" gap="0.5rem">
  <wb-badge label="Stays"></div>
  <wb-badge label="On"></div>
  <wb-badge label="One Line"></div>
</wb-flex>
```

### Native `<div>` (Enhanced)

```html
<!-- x-flex works on any element -->
<div x-flex direction="row" gap="0.75rem">
  <wb-badge label="A"></div>
  <wb-badge label="B"></div>
</div>
```

## Generated Structure

`flex()` does not add or remove elements -- it adds one class and applies inline styles directly to the host, leaving children untouched:

```html
<wb-flex
  class="wb-flex"
  style="display:flex;
         flex-direction:row;
         flex-wrap:wrap;
         justify-content:flex-start;
         align-items:stretch;
         gap:1rem;">
  <!-- original children, unmodified -->
</wb-flex>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.wb-flex` | Always | Marker class added by `flex()`; carries no CSS rules of its own in the current stylesheets -- layout comes entirely from the inline styles set alongside it |

## Methods

None. `flex()` returns a cleanup function that removes `.wb-flex`, and attaches no API to the element.

## Events

None. `<wb-flex>` dispatches no custom events.

## CSS API

`flex()` has no dedicated CSS custom properties -- `direction`/`wrap`/`justify`/`align`/`gap` are all set directly from attributes as inline styles, not through themeable CSS variables.

## Accessibility

`<wb-flex>` is a purely presentational layout container -- it sets no ARIA role or attributes. Give individual children their own accessible names/roles as appropriate.
