# Input - wb-starter v3.0

Text input field with label, helper text, and validation states.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-input>` |
| Behavior | `input` |
| Semantic | `<div>` (role="textbox") |
| Root CSS Class | `x-input` |
| Category | Forms |
| Schema | `src/wb-models/input.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Input label text |
| `placeholder` | string | `""` | Placeholder text |
| `value` | string | `""` | Input value |
| `name` | string | `""` | Form field name |
| `inputType` | string | `"text"` | Type: `text`, `email`, `password`, `number`, `tel`, `url`, `search`, `date`, `time`, `datetime-local` |
| `helper` | string | `""` | Helper text below input |
| `error` | string | `""` | Error message (shows error state) |
| `variant` | string | `"default"` | Variant: `default`, `success`, `error` |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg` |
| `disabled` | boolean | `false` | Disabled state |
| `readonly` | boolean | `false` | Read-only state |
| `required` | boolean | `false` | Required field |
| `icon` | string | `""` | Icon (emoji or icon name) |
| `iconPosition` | string | `"start"` | Icon position: `start`, `end` |
| `clearable` | boolean | `false` | Show clear button |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-input
  label="Email"
  input-type="email"
  placeholder="Enter your email">
</div>
</div>

## Usage

### Custom Element

```html
<div x-input
  label="Email"
  input-type="email"
  placeholder="Enter your email">
</div>
```

### Native Input (Enhanced)

```html
<input
  type="text"
  placeholder="Search...">
```

### With Label and Helper

```html
<div x-input
  label="Username"
  placeholder="Enter username"
  helper="Must be 3-20 characters">
</div>
```

### With Icon

```html
<div x-input
  label="Search"
  icon="🔍"
  placeholder="Search...">
</div>
<div x-input
  label="Email"
  icon="📧"
  iconPosition="end"
  inputType="email">
</div>
```

### Clearable

```html
<div x-input
  label="Search"
  placeholder="Type to search..."
  clearable>
</div>
```

### Validation States

```html
<div x-input
  label="Valid Field"
  variant="success"
  value="Correct!">
</div>
<div x-input
  label="Invalid Field"
  variant="error"
  error="This field is required">
</div>
```

### Sizes

```html
<div x-input
  label="Small"
  size="sm">
</div>
<div x-input
  label="Medium"
  size="md">
</div>
<div x-input
  label="Large"
  size="lg">
</div>
```

### Input Types

```html
<div x-input
  label="Email"
  inputType="email">
</div>
<div x-input
  label="Password"
  inputType="password">
</div>
<div x-input
  label="Number"
  inputType="number">
</div>
<div x-input
  label="Date"
  inputType="date">
</div>
```

## Generated Structure

```html
<div class="x-input">
  <label class="x-input__label"> Label <span class="x-input__required">*</span>
  </label>
  <div class="x-input__wrapper">
    <span class="x-input__icon">🔍</span>
    <input
      type="text"
      class="x-input__field">
    <button class="x-input__clear">✕</button>
  </div>
  <span class="x-input__helper">Helper text</span>
  <span class="x-input__error">Error message</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-input` | Always | Base styling |
| `.x-input--sm` | `size="sm"` | Small size |
| `.x-input--md` | `size="md"` | Medium size |
| `.x-input--lg` | `size="lg"` | Large size |
| `.x-input--success` | `variant="success"` | Success state |
| `.x-input--error` | `variant="error"` | Error state |
| `.x-input--disabled` | `disabled` | Disabled state |
| `.x-input--has-icon` | `icon` | Has icon |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets current value | `string` |
| `setValue(value)` | Sets input value | - |
| `clear()` | Clears the input | - |
| `focus()` | Focuses the input | - |
| `blur()` | Removes focus | - |
| `select()` | Selects all text | - |
| `setError(message)` | Sets error state | - |
| `clearError()` | Clears error state | - |
| `validate()` | Validates the input | `boolean` |
| `enable()` | Enables the input | - |
| `disable()` | Disables the input | - |

```javascript
const input = document.querySelector('x-input');

// Get/set value
const value = input.getValue();
input.setValue('New value');
input.clear();

// Focus handling
input.focus();
input.select();

// Validation
input.setError('Invalid email format');
input.clearError();
const isValid = input.validate();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `input` | Value changes | `{ value: string }` |
| `change` | Value committed | `{ value: string }` |
| `focus` | Input receives focus | `{}` |
| `blur` | Input loses focus | `{}` |

```javascript
input.addEventListener('input', (e) => {
  console.log('Value:', e.detail.value);
});

input.addEventListener('change', (e) => {
  console.log('Committed:', e.detail.value);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-input-height` | `2.5rem` | Input height |
| `--x-input-padding-x` | `0.75rem` | Horizontal padding |
| `--x-input-padding-y` | `0.5rem` | Vertical padding |
| `--x-input-radius` | `4px` | Border radius |
| `--x-input-font-size` | `0.875rem` | Font size |
| `--x-input-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--x-input-border` | `1px solid var(--border-color)` | Border style |
| `--x-input-color` | `var(--text-primary)` | Text color |
| `--x-input-placeholder-color` | `var(--text-tertiary)` | Placeholder color |
| `--x-input-focus-border` | `var(--primary, #6366f1)` | Focus border color |
| `--x-input-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--x-input-disabled-bg` | `var(--bg-disabled)` | Disabled background |
| `--x-input-disabled-color` | `var(--text-disabled)` | Disabled text color |
| `--x-input-success-border` | `var(--success, #22c55e)` | Success border |
| `--x-input-success-focus-ring` | `0 0 0 3px rgba(34, 197, 94, 0.2)` | Success focus ring |
| `--x-input-error-border` | `var(--error, #ef4444)` | Error border |
| `--x-input-error-focus-ring` | `0 0 0 3px rgba(239, 68, 68, 0.2)` | Error focus ring |
| `--x-input-label-size` | `0.875rem` | Label font size |
| `--x-input-label-weight` | `500` | Label font weight |
| `--x-input-label-color` | `var(--text-primary)` | Label color |
| `--x-input-label-gap` | `0.5rem` | Gap between label and input |
| `--x-input-helper-size` | `0.75rem` | Helper text size |
| `--x-input-helper-color` | `var(--text-secondary)` | Helper text color |
| `--x-input-error-color` | `var(--error, #ef4444)` | Error text color |
| `--x-input-icon-size` | `1rem` | Icon size |
| `--x-input-icon-color` | `var(--text-secondary)` | Icon color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `textbox` | Implicit |
| `aria-required` | `true` | When required |
| `aria-invalid` | `true` | When in error state |
| `aria-describedby` | Helper/error ID | When helper or error exists |

## Schema

Location: `src/wb-models/input.schema.json`
