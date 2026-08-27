# Checkbox - wb-starter v3.0

Checkbox input with label and custom styling.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-checkbox>` |
| Behavior | `checkbox` |
| Semantic | `<div>` (role="checkbox") |
| Root CSS Class | `x-checkbox` |
| Category | Forms |
| Schema | `src/wb-models/checkbox.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Label text |
| `checked` | boolean | `false` | Checked state |
| `disabled` | boolean | `false` | Disabled state |
| `indeterminate` | boolean | `false` | Indeterminate state |
| `name` | string | `""` | Form field name |
| `value` | string | `""` | Form field value |
| `required` | boolean | `false` | Required field |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg` |
| `variant` | string | `"default"` | Variant: `default`, `primary`, `success` |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-checkbox label="I agree to the terms"></div>
</div>

## Usage

### Custom Element

```html
<div x-checkbox label="I agree to the terms"></div>
```

### Native Input (Enhanced)

```html
<input
  type="checkbox"
  x-checkbox
  label="Subscribe">
```

### Pre-Checked

```html
<div x-checkbox
  label="Remember me"
  checked>
</div>
```

### Indeterminate State

```html
<div x-checkbox
  label="Select All"
  indeterminate>
</div>
```

### Disabled

```html
<div x-checkbox
  label="Unavailable option"
  disabled>
</div>
```

### Sizes

```html
<div x-checkbox
  label="Small"
  size="sm">
</div>
<div x-checkbox
  label="Medium"
  size="md">
</div>
<div x-checkbox
  label="Large"
  size="lg">
</div>
```

### In Forms

```html
<div x-checkbox
  label="Subscribe to newsletter"
  name="subscribe"
  value="yes"
  required>
</div>
```

## Generated Structure

```html
<div class="x-checkbox">
  <input
    type="checkbox"
    class="x-checkbox__input">
  <span class="x-checkbox__box">
    <span class="x-checkbox__check"></span>
  </span>
  <span class="x-checkbox__label">Label text</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-checkbox` | Always | Base styling |
| `.x-checkbox--checked` | `checked` | Checked state |
| `.x-checkbox--indeterminate` | `indeterminate` | Indeterminate state |
| `.x-checkbox--disabled` | `disabled` | Disabled state |
| `.x-checkbox--sm` | `size="sm"` | Small size |
| `.x-checkbox--md` | `size="md"` | Medium size |
| `.x-checkbox--lg` | `size="lg"` | Large size |
| `.x-checkbox--primary` | `variant="primary"` | Primary variant |
| `.x-checkbox--success` | `variant="success"` | Success variant |

## Methods

| Method | Description |
|--------|-------------|
| `check()` | Checks the checkbox |
| `uncheck()` | Unchecks the checkbox |
| `toggle()` | Toggles checked state |
| `isChecked()` | Returns checked state (boolean) |
| `enable()` | Enables the checkbox |
| `disable()` | Disables the checkbox |

```javascript
const checkbox = document.querySelector('x-checkbox');

// Check/uncheck
checkbox.check();
checkbox.uncheck();
checkbox.toggle();

// Query state
if (checkbox.isChecked()) {
  console.log('Checkbox is checked');
}
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:checkbox:change` | State changes | `{ checked: boolean }` |

```javascript
checkbox.addEventListener('wb:checkbox:change', (e) => {
  console.log('Checked:', e.detail.checked);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-checkbox-size` | `18px` | Checkbox size |
| `--x-checkbox-radius` | `4px` | Border radius |
| `--x-checkbox-border` | `2px solid var(--border-color)` | Border style |
| `--x-checkbox-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--x-checkbox-checked-bg` | `var(--primary, #6366f1)` | Checked background |
| `--x-checkbox-checked-border` | `var(--primary, #6366f1)` | Checked border |
| `--x-checkbox-check-color` | `#ffffff` | Checkmark color |
| `--x-checkbox-disabled-opacity` | `0.5` | Disabled opacity |
| `--x-checkbox-label-gap` | `0.5rem` | Gap between box and label |
| `--x-checkbox-label-size` | `0.875rem` | Label font size |
| `--x-checkbox-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `checkbox` | Implicit |
| `aria-checked` | `true/false/mixed` | Dynamic |
| `aria-disabled` | `true` | When disabled |

Keyboard support:
- `Space` - Toggle checkbox

## Schema

Location: `src/wb-models/checkbox.schema.json`
