# Button - WB Framework v3.0

Interactive button with variants, sizes, and optional icon.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-button>` |
| Behavior | `button` |
| Semantic | `<button>` |
| Base Class | `wb-button` |
| Category | Forms |
| Schema | `src/wb-models/button.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Button text |
| `icon` | string | `""` | Icon (emoji or icon name) |
| `iconPosition` | string | `"start"` | Icon position: `start`, `end` |
| `variant` | string | `"primary"` | Visual style: `primary`, `secondary`, `success`, `warning`, `error`, `ghost`, `outline`, `link` |
| `size` | string | `"md"` | Size: `xs`, `sm`, `md`, `lg`, `xl` |
| `disabled` | boolean | `false` | Disabled state |
| `loading` | boolean | `false` | Loading state with spinner |
| `fullWidth` | boolean | `false` | Full width button |
| `iconOnly` | boolean | `false` | Icon-only button (square) |

## Usage

### Custom Element

```html
<wb-button label="Click Me"></wb-button>
```

### Native Button (Enhanced)

```html
<button data-wb="button">Click Me</button>
```

### With Icon

```html
<wb-button label="Save" icon="💾"></wb-button>

<wb-button label="Next" icon="→" iconPosition="end"></wb-button>
```

### Variants

```html
<wb-button label="Primary" variant="primary"></wb-button>
<wb-button label="Secondary" variant="secondary"></wb-button>
<wb-button label="Success" variant="success"></wb-button>
<wb-button label="Warning" variant="warning"></wb-button>
<wb-button label="Error" variant="error"></wb-button>
<wb-button label="Ghost" variant="ghost"></wb-button>
<wb-button label="Outline" variant="outline"></wb-button>
<wb-button label="Link" variant="link"></wb-button>
```

### Sizes

```html
<wb-button label="XS" size="xs"></wb-button>
<wb-button label="SM" size="sm"></wb-button>
<wb-button label="MD" size="md"></wb-button>
<wb-button label="LG" size="lg"></wb-button>
<wb-button label="XL" size="xl"></wb-button>
```

### States

```html
<wb-button label="Disabled" disabled></wb-button>
<wb-button label="Loading..." loading></wb-button>
<wb-button label="Full Width" fullWidth></wb-button>
```

## Generated Structure

```html
<button class="wb-button wb-button--primary wb-button--md">
  <span class="wb-button__icon">💾</span>
  <span class="wb-button__label">Save</span>
</button>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-button` | Always | Base styling |
| `.wb-button--primary` | `variant="primary"` | Primary variant |
| `.wb-button--secondary` | `variant="secondary"` | Secondary variant |
| `.wb-button--success` | `variant="success"` | Success variant |
| `.wb-button--warning` | `variant="warning"` | Warning variant |
| `.wb-button--error` | `variant="error"` | Error variant |
| `.wb-button--ghost` | `variant="ghost"` | Ghost variant |
| `.wb-button--outline` | `variant="outline"` | Outline variant |
| `.wb-button--link` | `variant="link"` | Link variant |
| `.wb-button--loading` | `loading` | Loading state |
| `.wb-button--full` | `fullWidth` | Full width |
| `.wb-button--icon-only` | `iconOnly` | Icon-only square |

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
const btn = document.querySelector('wb-button');

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
| `--wb-button-padding-x` | `1rem` | Horizontal padding |
| `--wb-button-padding-y` | `0.5rem` | Vertical padding |
| `--wb-button-radius` | `4px` | Border radius |
| `--wb-button-font-size` | `0.875rem` | Font size |
| `--wb-button-font-weight` | `600` | Font weight |
| `--wb-button-gap` | `0.5rem` | Gap between icon and label |
| `--wb-button-transition` | `all 0.15s ease` | Transition for states |
| `--wb-button-primary-bg` | `var(--primary, #6366f1)` | Primary background |
| `--wb-button-primary-color` | `#ffffff` | Primary text color |
| `--wb-button-primary-hover-bg` | `var(--primary-dark, #4f46e5)` | Primary hover background |
| `--wb-button-secondary-bg` | `var(--secondary, #64748b)` | Secondary background |
| `--wb-button-secondary-color` | `#ffffff` | Secondary text color |
| `--wb-button-success-bg` | `var(--success, #4caf50)` | Success background |
| `--wb-button-success-color` | `#ffffff` | Success text color |
| `--wb-button-warning-bg` | `var(--warning, #ff9800)` | Warning background |
| `--wb-button-warning-color` | `#ffffff` | Warning text color |
| `--wb-button-error-bg` | `var(--error, #f44336)` | Error background |
| `--wb-button-error-color` | `#ffffff` | Error text color |
| `--wb-button-ghost-bg` | `transparent` | Ghost background |
| `--wb-button-ghost-color` | `var(--text-primary)` | Ghost text color |
| `--wb-button-ghost-hover-bg` | `var(--bg-hover)` | Ghost hover background |
| `--wb-button-outline-border` | `1px solid currentColor` | Outline border |
| `--wb-button-disabled-opacity` | `0.5` | Disabled opacity |
| `--wb-button-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.3)` | Focus ring |

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
