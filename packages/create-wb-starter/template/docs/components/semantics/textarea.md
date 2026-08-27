# Textarea - wb-starter v3.0

Multi-line text input with autosize and character count.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<textarea>` |
| Behavior | `textarea` |
| Semantic | `<div>` (role="textbox") |
| Root CSS Class | `x-textarea` |
| Category | Forms |
| Schema | `src/wb-models/textarea.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Field label |
| `placeholder` | string | `""` | Placeholder text |
| `value` | string | `""` | Text value |
| `name` | string | `""` | Form field name |
| `rows` | number | `3` | Visible rows |
| `maxLength` | number | `0` | Max character limit (0 = unlimited) |
| `showCount` | boolean | `false` | Show character count |
| `autosize` | boolean | `false` | Auto-resize to content |
| `disabled` | boolean | `false` | Disabled state |
| `readonly` | boolean | `false` | Read-only state |
| `required` | boolean | `false` | Required field |
| `resize` | string | `"vertical"` | Resize: `none`, `vertical`, `horizontal`, `both` |
| `variant` | string | `"default"` | Variant: `default`, `success`, `error` |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<textarea
  label="Message"
  placeholder="Enter your message...">
</textarea>
</div>

## Usage

### Custom Element

```html
<textarea
  label="Message"
  placeholder="Enter your message...">
</textarea>
```

### Native Textarea (Enhanced)

```html
<textarea
  placeholder="Write something...">
</textarea>
```

### With Label

```html
<textarea
  label="Description"
  placeholder="Enter description...">
</textarea>
```

### Character Count

```html
<textarea
  label="Bio"
  placeholder="Tell us about yourself..."
  maxLength="200"
  showCount>
</textarea>
```

### Autosize

```html
<textarea
  label="Comment"
  placeholder="Write a comment..."
  autosize>
</textarea>
```

### Custom Rows

```html
<textarea
  label="Notes"
  rows="5">
</textarea>
<textarea
  label="Content"
  rows="10">
</textarea>
```

### Resize Options

```html
<textarea
  label="No resize"
  resize="none">
</textarea>
<textarea
  label="Vertical only"
  resize="vertical">
</textarea>
<textarea
  label="Both directions"
  resize="both">
</textarea>
```

### Validation States

```html
<textarea
  label="Valid"
  variant="success">
</textarea>
<textarea
  label="Error"
  variant="error">
</textarea>
```

### Disabled/Readonly

```html
<textarea
  label="Disabled"
  disabled>
</textarea>
<textarea
  label="Readonly"
  readonly
  value="Can't edit this">
</textarea>
```

## Generated Structure

```html
<div class="x-textarea">
  <label class="x-textarea__label">Label</label>
  <textarea
    class="x-textarea__field"
    rows="3">
  </textarea>
  <span class="x-textarea__counter">0 / 200</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-textarea` | Always | Base styling |
| `.x-textarea--autosize` | `autosize` | Auto-resizing |
| `.x-textarea--success` | `variant="success"` | Success state |
| `.x-textarea--error` | `variant="error"` | Error state |
| `.x-textarea--disabled` | `disabled` | Disabled state |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets current value | `string` |
| `setValue(value)` | Sets value | - |
| `clear()` | Clears the textarea | - |
| `focus()` | Focuses the textarea | - |
| `blur()` | Removes focus | - |
| `select()` | Selects all text | - |
| `enable()` | Enables the textarea | - |
| `disable()` | Disables the textarea | - |

```javascript
const textarea = document.querySelector('x-textarea');

// Get/set value
const value = textarea.getValue();
textarea.setValue('New content');
textarea.clear();

// Focus handling
textarea.focus();
textarea.select();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `input` | Value changes | `{ value: string }` |
| `change` | Value committed | `{ value: string }` |

```javascript
textarea.addEventListener('input', (e) => {
  console.log('Value:', e.detail.value);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-textarea-padding` | `0.75rem` | Textarea padding |
| `--x-textarea-radius` | `4px` | Border radius |
| `--x-textarea-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--x-textarea-border` | `1px solid var(--border-color)` | Border |
| `--x-textarea-font-size` | `0.875rem` | Font size |
| `--x-textarea-line-height` | `1.5` | Line height |
| `--x-textarea-focus-border` | `var(--primary, #6366f1)` | Focus border |
| `--x-textarea-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--x-textarea-disabled-bg` | `var(--bg-disabled)` | Disabled background |
| `--x-textarea-counter-size` | `0.75rem` | Counter font size |
| `--x-textarea-counter-color` | `var(--text-secondary)` | Counter color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `textbox` | Implicit |
| `aria-multiline` | `true` | Always |
| `aria-required` | `true` | When required |
| `aria-describedby` | Counter ID | When showCount is true |

## Schema

Location: `src/wb-models/textarea.schema.json`
