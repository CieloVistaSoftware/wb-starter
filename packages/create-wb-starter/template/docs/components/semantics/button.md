# Button - wb-starter v3.0

Interactive button with variants, sizes, and optional icon.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<button>` |
| Behavior | `button` |
| Semantic | `<button>` |
| Root CSS Class | `x-button` |
| Category | Forms |
| Schema | `src/wb-models/button.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | string | `""` | Icon (emoji or icon name) |
| `iconPosition` | string | `"start"` | Icon position: `start`, `end` |
| `variant` | string | `"primary"` | Visual style: `primary`, `secondary`, `success`, `warning`, `error`, `ghost`, `outline`, `link` |
| `size` | string | `"md"` | Size: `xs`, `sm`, `md`, `lg`, `xl` |
| `disabled` | boolean | `false` | Disabled state |
| `loading` | boolean | `false` | Loading state with spinner |
| `fullWidth` | boolean | `false` | Full width button |
| `iconOnly` | boolean | `false` | Icon-only button (square) |

Button text is set via the element's content (children), not an attribute.

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<button>Click Me</button>
</div>

## Usage

### Custom Element

<div x-demo>
<button>Click Me</button>
</div>

### Native Button (Enhanced)

`autoInjectComponents` is on by default — a plain `<button>` is enhanced
automatically, no `x-button` attribute needed.

<div x-demo>
<button>Click Me</button>
</div>

### With Icon

<div x-demo columns="2">
<button
  label="Save"
  icon="💾">
</button>
<button
  label="Next"
  icon="→"
  iconPosition="end">
</button>
</div>

### Variants

<div x-demo columns="4">
<button
  label="Primary"
  variant="primary">
</button>
<button
  label="Secondary"
  variant="secondary">
</button>
<button
  label="Success"
  variant="success">
</button>
<button
  label="Warning"
  variant="warning">
</button>
<button
  label="Error"
  variant="error">
</button>
<button
  label="Ghost"
  variant="ghost">
</button>
<button
  label="Outline"
  variant="outline">
</button>
<button
  label="Link"
  variant="link">
</button>
</div>

### Sizes

<div x-demo columns="5">
<button
  label="XS"
  size="xs">
</button>
<button
  label="SM"
  size="sm">
</button>
<button
  label="MD"
  size="md">
</button>
<button
  label="LG"
  size="lg">
</button>
<button
  label="XL"
  size="xl">
</button>
</div>

### States

<div x-demo columns="3">
<button
  label="Disabled"
  disabled>
</button>
<button
  label="Loading..."
  loading>
</button>
<button
  label="Full Width"
  fullWidth>
</button>
</div>

## Generated Structure

```html
<button class="x-button x-button--primary x-button--md">
  <span class="x-button__icon">💾</span>
  <span class="x-button__label">Save</span>
</button>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-button` | Always | Base styling |
| `.x-button--primary` | `variant="primary"` | Primary variant |
| `.x-button--secondary` | `variant="secondary"` | Secondary variant |
| `.x-button--success` | `variant="success"` | Success variant |
| `.x-button--warning` | `variant="warning"` | Warning variant |
| `.x-button--error` | `variant="error"` | Error variant |
| `.x-button--ghost` | `variant="ghost"` | Ghost variant |
| `.x-button--outline` | `variant="outline"` | Outline variant |
| `.x-button--link` | `variant="link"` | Link variant |
| `.x-button--loading` | `loading` | Loading state |
| `.x-button--full` | `fullWidth` | Full width |
| `.x-button--icon-only` | `iconOnly` | Icon-only square |

## Methods

| Method | Description |
|--------|-------------|
| `enable()` | Enables the button |
| `disable()` | Disables the button |
| `startLoading()` | Shows loading state |
| `stopLoading()` | Hides loading state |
| `click()` | Programmatically clicks |
| `focus()` | Focuses the button |
| `blur()` | Removes focus |

```javascript
const btn = document.querySelector('x-button');

// Toggle disabled state
btn.disable();
btn.enable();

// Loading state
btn.startLoading();
btn.stopLoading();
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-button-padding-x` | `1rem` | Horizontal padding |
| `--x-button-padding-y` | `0.5rem` | Vertical padding |
| `--x-button-radius` | `4px` | Border radius |
| `--x-button-font-size` | `0.875rem` | Font size |
| `--x-button-font-weight` | `600` | Font weight |
| `--x-button-gap` | `0.5rem` | Gap between icon and label |
| `--x-button-transition` | `all 0.15s ease` | Transition for states |
| `--x-button-primary-bg` | `var(--primary, #6366f1)` | Primary background |
| `--x-button-primary-color` | `#ffffff` | Primary text color |
| `--x-button-primary-hover-bg` | `var(--primary-dark, #4f46e5)` | Primary hover background |
| `--x-button-secondary-bg` | `var(--secondary, #64748b)` | Secondary background |
| `--x-button-secondary-color` | `#ffffff` | Secondary text color |
| `--x-button-success-bg` | `var(--success, #4caf50)` | Success background |
| `--x-button-success-color` | `#ffffff` | Success text color |
| `--x-button-warning-bg` | `var(--warning, #ff9800)` | Warning background |
| `--x-button-warning-color` | `#ffffff` | Warning text color |
| `--x-button-error-bg` | `var(--error, #f44336)` | Error background |
| `--x-button-error-color` | `#ffffff` | Error text color |
| `--x-button-ghost-bg` | `transparent` | Ghost background |
| `--x-button-ghost-color` | `var(--text-primary)` | Ghost text color |
| `--x-button-ghost-hover-bg` | `var(--bg-hover)` | Ghost hover background |
| `--x-button-outline-border` | `1px solid currentColor` | Outline border |
| `--x-button-disabled-opacity` | `0.5` | Disabled opacity |
| `--x-button-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.3)` | Focus ring |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `button` | Implicit |
| `aria-disabled` | `true` | When disabled |

Keyboard support:
- `Enter` - Activate button
- `Space` - Activate button

## Schema

Location: `src/wb-models/button.schema.json`
