# Checkbox - WB Framework v3.0

Checkbox input with label and custom styling.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-checkbox>` |
| Behavior | `checkbox` |
| Semantic | `<div>` (role="checkbox") |
| Base Class | `wb-checkbox` |
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

## Usage

### Custom Element

```html
<wb-checkbox label="I agree to the terms"></wb-checkbox>
```

### Native Input (Enhanced)

```html
<input type="checkbox" data-wb="checkbox" data-wb-label="Subscribe">
```

### Pre-Checked

```html
<wb-checkbox label="Remember me" checked></wb-checkbox>
```

### Indeterminate State

```html
<wb-checkbox label="Select All" indeterminate></wb-checkbox>
```

### Disabled

```html
<wb-checkbox label="Unavailable option" disabled></wb-checkbox>
```

### Sizes

```html
<wb-checkbox label="Small" size="sm"></wb-checkbox>
<wb-checkbox label="Medium" size="md"></wb-checkbox>
<wb-checkbox label="Large" size="lg"></wb-checkbox>
```

### In Forms

```html
<wb-checkbox 
  label="Subscribe to newsletter" 
  name="subscribe" 
  value="yes"
  required>
</wb-checkbox>
```

## Generated Structure

```html
<div class="wb-checkbox">
  <input type="checkbox" class="wb-checkbox__input">
  <span class="wb-checkbox__box">
    <span class="wb-checkbox__check"></span>
  </span>
  <span class="wb-checkbox__label">Label text</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-checkbox` | Always | Base styling |
| `.wb-checkbox--checked` | `checked` | Checked state |
| `.wb-checkbox--indeterminate` | `indeterminate` | Indeterminate state |
| `.wb-checkbox--disabled` | `disabled` | Disabled state |
| `.wb-checkbox--sm` | `size="sm"` | Small size |
| `.wb-checkbox--md` | `size="md"` | Medium size |
| `.wb-checkbox--lg` | `size="lg"` | Large size |
| `.wb-checkbox--primary` | `variant="primary"` | Primary variant |
| `.wb-checkbox--success` | `variant="success"` | Success variant |

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
const checkbox = document.querySelector('wb-checkbox');

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
| `--wb-checkbox-size` | `18px` | Checkbox size |
| `--wb-checkbox-radius` | `4px` | Border radius |
| `--wb-checkbox-border` | `2px solid var(--border-color)` | Border style |
| `--wb-checkbox-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-checkbox-checked-bg` | `var(--primary, #6366f1)` | Checked background |
| `--wb-checkbox-checked-border` | `var(--primary, #6366f1)` | Checked border |
| `--wb-checkbox-check-color` | `#ffffff` | Checkmark color |
| `--wb-checkbox-disabled-opacity` | `0.5` | Disabled opacity |
| `--wb-checkbox-label-gap` | `0.5rem` | Gap between box and label |
| `--wb-checkbox-label-size` | `0.875rem` | Label font size |
| `--wb-checkbox-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |

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
