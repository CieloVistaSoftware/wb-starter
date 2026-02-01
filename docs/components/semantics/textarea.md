# Textarea - wb-starter v3.0

Multi-line text input with autosize and character count.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-textarea>` |
| Behavior | `textarea` |
| Semantic | `<div>` (role="textbox") |
| Base Class | `wb-textarea` |
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

## Usage

### Custom Element

```html
<wb-textarea label="Message" placeholder="Enter your message..."></wb-textarea>
```

### Native Textarea (Enhanced)

```html
<textarea data-wb="textarea" placeholder="Write something..."></textarea>
```

### With Label

```html
<wb-textarea label="Description" placeholder="Enter description..."></wb-textarea>
```

### Character Count

```html
<wb-textarea 
  label="Bio" 
  placeholder="Tell us about yourself..."
  maxLength="200"
  showCount>
</wb-textarea>
```

### Autosize

```html
<wb-textarea 
  label="Comment" 
  placeholder="Write a comment..."
  autosize>
</wb-textarea>
```

### Custom Rows

```html
<wb-textarea label="Notes" rows="5"></wb-textarea>
<wb-textarea label="Content" rows="10"></wb-textarea>
```

### Resize Options

```html
<wb-textarea label="No resize" resize="none"></wb-textarea>
<wb-textarea label="Vertical only" resize="vertical"></wb-textarea>
<wb-textarea label="Both directions" resize="both"></wb-textarea>
```

### Validation States

```html
<wb-textarea label="Valid" variant="success"></wb-textarea>
<wb-textarea label="Error" variant="error"></wb-textarea>
```

### Disabled/Readonly

```html
<wb-textarea label="Disabled" disabled></wb-textarea>
<wb-textarea label="Readonly" readonly value="Can't edit this"></wb-textarea>
```

## Generated Structure

```html
<div class="wb-textarea">
  <label class="wb-textarea__label">Label</label>
  <textarea class="wb-textarea__field" rows="3"></textarea>
  <span class="wb-textarea__counter">0 / 200</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-textarea` | Always | Base styling |
| `.wb-textarea--autosize` | `autosize` | Auto-resizing |
| `.wb-textarea--success` | `variant="success"` | Success state |
| `.wb-textarea--error` | `variant="error"` | Error state |
| `.wb-textarea--disabled` | `disabled` | Disabled state |

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
const textarea = document.querySelector('wb-textarea');

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
| `--wb-textarea-padding` | `0.75rem` | Textarea padding |
| `--wb-textarea-radius` | `4px` | Border radius |
| `--wb-textarea-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-textarea-border` | `1px solid var(--border-color)` | Border |
| `--wb-textarea-font-size` | `0.875rem` | Font size |
| `--wb-textarea-line-height` | `1.5` | Line height |
| `--wb-textarea-focus-border` | `var(--primary, #6366f1)` | Focus border |
| `--wb-textarea-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--wb-textarea-disabled-bg` | `var(--bg-disabled)` | Disabled background |
| `--wb-textarea-counter-size` | `0.75rem` | Counter font size |
| `--wb-textarea-counter-color` | `var(--text-secondary)` | Counter color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `textbox` | Implicit |
| `aria-multiline` | `true` | Always |
| `aria-required` | `true` | When required |
| `aria-describedby` | Counter ID | When showCount is true |

## Schema

Location: `src/wb-models/textarea.schema.json`
