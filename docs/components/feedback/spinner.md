# Spinner - wb-starter v3.0

Loading spinner (animated ring) with size, color, and speed variants.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-spinner>` |
| Behavior | `spinner` |
| Semantic | `<div role="status">` |
| Root CSS Class | `<div x-spinner>` |
| Category | Feedback |
| Schema | `src/wb-models/spinner.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg`, `xl` |
| `variant` | string | `"primary"`* | Ring color: `default`, `primary`, `success`, `warning`, `error` (also accepts `color` as an alias) |
| `speed` | string | `"medium"`* | Animation speed: `slow`, `medium`, `fast` |
| `label` | string | `"Loading"` | Accessible label (`aria-label`) |

\* `spinner()` (`src/wb-viewmodels/feedback.js`) itself defaults `size` to `"md"` when no attribute/class already set it; `variant`/`speed` classes are only added when the attribute is present (an unset `variant`/`speed` renders the plain default ring).

## Usage

### Custom Element

<wb-demo>
<div x-spinner></div>
</wb-demo>

### Sizes

```html
<wb-spinner size="xs"></div>
<wb-spinner size="sm"></div>
<wb-spinner size="md"></div>
<wb-spinner size="lg"></div>
<wb-spinner size="xl"></div>
```

### Color Variants

```html
<wb-spinner variant="primary"></div>
<wb-spinner variant="success"></div>
<wb-spinner variant="warning"></div>
<wb-spinner variant="error"></div>
```

### Speeds

```html
<wb-spinner speed="slow"></div>
<wb-spinner speed="medium"></div>
<wb-spinner speed="fast"></div>
```

### Combined

```html
<wb-spinner size="lg" variant="success" speed="fast"></div>
```

## Generated Structure

```html
<wb-spinner class="wb-spinner--md wb-spinner--primary" role="status" aria-label="Loading">
  <div></div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `<div x-spinner>` (tag selector) | Always | Neutralizes the legacy element-level ring so only the inner `<div>` ring renders |
| `.wb-spinner--{xs,sm,md,lg,xl}` | `size` | Ring diameter + border width |
| `.wb-spinner--{slow,medium,fast}` | `speed` | Animation duration (2s / 1.2s / 0.6s) |
| `.wb-spinner--{default,primary,success,warning,error,info}` | `variant`/`color` | Ring accent (`border-top-color`) |

## Methods

The methods below come from `spinner.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`). `spinner()` itself (`src/wb-viewmodels/feedback.js`) does not implement `show`/`hide` -- they resolve to the schema builder's generic, real implementations (toggling `element.hidden`).

| Method | Description |
|--------|-------------|
| `show()` | Shows the spinner (`element.hidden = false`) |
| `hide()` | Hides the spinner (`element.hidden = true`) |

```javascript
const spinner = document.querySelector('wb-spinner');

spinner.hide();
spinner.show();
```

## Events

`show()`/`hide()` dispatch the generic `wb:show`/`wb:hide` events. The spinner has no dedicated custom events of its own -- it is a purely visual, non-interactive indicator.

## CSS API

There are no dedicated `--wb-spinner-*` custom properties in the shipped CSS (`src/styles/site.css`, `src/styles/behaviors/effects.css`) -- size and speed are set via modifier classes, and color reads the same theme tokens as the rest of the site:

| Variable | Used For | Description |
|----------|----------|--------------|
| `--border-color` | Ring track | Unfilled portion of the ring |
| `--primary` | Default ring color | Spinning accent when no `variant` is set |
| `--success-color` / `--warning-color` / `--danger-color` / `--info-color` | `variant="success"`/`"warning"`/`"error"`/`"info"` | Per-variant ring accent |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="status"` | Announces the loading state to assistive technology |
| `aria-label` | Reflects `label` (default `"Loading"`) |

Respect `prefers-reduced-motion` at the page level if you need to suppress the spin animation site-wide; the spinner itself always animates while mounted.
