# Input - wb-starter v3.0

Text input field with label, helper text, and validation states.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-input>` |
| Behavior | `input` |
| Semantic | `<div>` (role="textbox") |
| Base Class | `wb-input` |
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

## Usage

### Custom Element

```html
<wb-input label="Email" inputType="email" placeholder="Enter your email"></wb-input>
```

### Native Input (Enhanced)

```html
<input type="text" data-wb="input" placeholder="Search...">
```

### With Label and Helper

```html
<wb-input 
  label="Username" 
  placeholder="Enter username"
  helper="Must be 3-20 characters">
</wb-input>
```

### With Icon

```html
<wb-input label="Search" icon="🔍" placeholder="Search..."></wb-input>

<wb-input label="Email" icon="📧" iconPosition="end" inputType="email"></wb-input>
```

### Clearable

```html
<wb-input label="Search" placeholder="Type to search..." clearable></wb-input>
```

### Validation States

```html
<wb-input label="Valid Field" variant="success" value="Correct!"></wb-input>

<wb-input label="Invalid Field" variant="error" error="This field is required"></wb-input>
```

### Sizes

```html
<wb-input label="Small" size="sm"></wb-input>
<wb-input label="Medium" size="md"></wb-input>
<wb-input label="Large" size="lg"></wb-input>
```

### Input Types

```html
<wb-input label="Email" inputType="email"></wb-input>
<wb-input label="Password" inputType="password"></wb-input>
<wb-input label="Number" inputType="number"></wb-input>
<wb-input label="Date" inputType="date"></wb-input>
```

## Generated Structure

```html
<div class="wb-input">
  <label class="wb-input__label">
    Label
    <span class="wb-input__required">*</span>
  </label>
  <div class="wb-input__wrapper">
    <span class="wb-input__icon">🔍</span>
    <input type="text" class="wb-input__field">
    <button class="wb-input__clear">✕</button>
  </div>
  <span class="wb-input__helper">Helper text</span>
  <span class="wb-input__error">Error message</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-input` | Always | Base styling |
| `.wb-input--sm` | `size="sm"` | Small size |
| `.wb-input--md` | `size="md"` | Medium size |
| `.wb-input--lg` | `size="lg"` | Large size |
| `.wb-input--success` | `variant="success"` | Success state |
| `.wb-input--error` | `variant="error"` | Error state |
| `.wb-input--disabled` | `disabled` | Disabled state |
| `.wb-input--has-icon` | `icon` | Has icon |

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
const input = document.querySelector('wb-input');

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
| `--wb-input-height` | `2.5rem` | Input height |
| `--wb-input-padding-x` | `0.75rem` | Horizontal padding |
| `--wb-input-padding-y` | `0.5rem` | Vertical padding |
| `--wb-input-radius` | `4px` | Border radius |
| `--wb-input-font-size` | `0.875rem` | Font size |
| `--wb-input-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-input-border` | `1px solid var(--border-color)` | Border style |
| `--wb-input-color` | `var(--text-primary)` | Text color |
| `--wb-input-placeholder-color` | `var(--text-tertiary)` | Placeholder color |
| `--wb-input-focus-border` | `var(--primary, #6366f1)` | Focus border color |
| `--wb-input-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--wb-input-disabled-bg` | `var(--bg-disabled)` | Disabled background |
| `--wb-input-disabled-color` | `var(--text-disabled)` | Disabled text color |
| `--wb-input-success-border` | `var(--success, #22c55e)` | Success border |
| `--wb-input-success-focus-ring` | `0 0 0 3px rgba(34, 197, 94, 0.2)` | Success focus ring |
| `--wb-input-error-border` | `var(--error, #ef4444)` | Error border |
| `--wb-input-error-focus-ring` | `0 0 0 3px rgba(239, 68, 68, 0.2)` | Error focus ring |
| `--wb-input-label-size` | `0.875rem` | Label font size |
| `--wb-input-label-weight` | `500` | Label font weight |
| `--wb-input-label-color` | `var(--text-primary)` | Label color |
| `--wb-input-label-gap` | `0.5rem` | Gap between label and input |
| `--wb-input-helper-size` | `0.75rem` | Helper text size |
| `--wb-input-helper-color` | `var(--text-secondary)` | Helper text color |
| `--wb-input-error-color` | `var(--error, #ef4444)` | Error text color |
| `--wb-input-icon-size` | `1rem` | Icon size |
| `--wb-input-icon-color` | `var(--text-secondary)` | Icon color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `textbox` | Implicit |
| `aria-required` | `true` | When required |
| `aria-invalid` | `true` | When in error state |
| `aria-describedby` | Helper/error ID | When helper or error exists |

## Schema

Location: `src/wb-models/input.schema.json`
