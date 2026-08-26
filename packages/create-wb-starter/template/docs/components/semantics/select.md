# Select - wb-starter v3.0

Enhanced select dropdown with search, clear, and multi-select.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<select>` |
| Behavior | `select` |
| Semantic | `<div>` (role="combobox") |
| Root CSS Class | `x-select` |
| Category | Forms |
| Schema | `src/wb-models/select.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Select label |
| `placeholder` | string | `"Select..."` | Placeholder text |
| `options` | string | `""` | Options as JSON `[{value, label}]` |
| `value` | string | `""` | Selected value |
| `name` | string | `""` | Form field name |
| `searchable` | boolean | `false` | Enable search |
| `clearable` | boolean | `false` | Enable clear button |
| `multiple` | boolean | `false` | Allow multiple selection |
| `disabled` | boolean | `false` | Disabled state |
| `required` | boolean | `false` | Required field |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg` |
| `variant` | string | `"default"` | Variant: `default`, `success`, `error` |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<select
  label="Country"
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'>
</select>
</div>

## Usage

### Custom Element

<div x-demo>
<select
  label="Country"
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'>
</select>
</div>

### Native Select (Enhanced)

`autoInjectComponents` is on by default — a plain `<select>` is enhanced
automatically, no `x-select` attribute needed.

<div x-demo>
<select>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
</div>

### With Label

<div x-demo>
<select
  label="Choose a language"
  placeholder="Select language..."
  options='[{"value":"en","label":"English"},{"value":"es","label":"Spanish"},{"value":"fr","label":"French"}]'>
</select>
</div>

### Searchable

<div x-demo>
<select
  label="Country"
  searchable
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"},{"value":"ca","label":"Canada"}]'>
</select>
</div>

### Clearable

<div x-demo>
<select
  label="Priority"
  clearable
  options='[{"value":"low","label":"Low"},{"value":"medium","label":"Medium"},{"value":"high","label":"High"}]'>
</select>
</div>

### Multi-Select

<div x-demo>
<select
  label="Tags"
  multiple
  options='[{"value":"bug","label":"Bug"},{"value":"feature","label":"Feature"},{"value":"docs","label":"Documentation"}]'>
</select>
</div>

### Sizes

<div x-demo>
<select
  label="Small"
  size="sm"
  options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'>
</select>
<select
  label="Medium"
  size="md"
  options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'>
</select>
<select
  label="Large"
  size="lg"
  options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'>
</select>
</div>

### Validation States

<div x-demo>
<select
  label="Valid"
  variant="success"
  options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'>
</select>
<select
  label="Error"
  variant="error"
  options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'>
</select>
</div>

## Generated Structure

```html
<div class="x-select">
  <label class="x-select__label">Label</label>
  <button class="x-select__trigger">
    <span class="x-select__value">Selected value</span>
    <button class="x-select__clear">×</button>
    <span class="x-select__arrow">▼</span>
  </button>
  <div class="x-select__dropdown">
    <input
      class="x-select__search"
      placeholder="Search...">
    <ul class="x-select__options">
      <li
        class="x-select__option"
        value="1">
        Option 1
      </li>
      <li
        class="x-select__option x-select__option--selected"
        value="2">
        Option 2
      </li>
    </ul>
  </div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-select` | Always | Base styling |
| `.x-select--open` | Dropdown open | Open state |
| `.x-select--searchable` | `searchable` | Has search |
| `.x-select--clearable` | `clearable` | Has clear button |
| `.x-select--multiple` | `multiple` | Multi-select mode |
| `.x-select--sm` | `size="sm"` | Small size |
| `.x-select--md` | `size="md"` | Medium size |
| `.x-select--lg` | `size="lg"` | Large size |
| `.x-select--success` | `variant="success"` | Success state |
| `.x-select--error` | `variant="error"` | Error state |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets selected value(s) | `string \| string[]` |
| `setValue(value)` | Sets selected value(s) | - |
| `clear()` | Clears selection | - |
| `open()` | Opens dropdown | - |
| `close()` | Closes dropdown | - |
| `toggle()` | Toggles dropdown | - |
| `focus()` | Focuses the select | - |
| `enable()` | Enables the select | - |
| `disable()` | Disables the select | - |
| `setOptions(options)` | Updates options | - |

```javascript
const select = document.querySelector('x-select');

// Get/set value
const value = select.getValue();
select.setValue('us');

// Multiple selection
select.setValue(['bug', 'feature']);

// Open/close
select.open();
select.close();
select.toggle();

// Update options dynamically
select.setOptions([
  { value: 'new1', label: 'New Option 1' },
  { value: 'new2', label: 'New Option 2' }
]);
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:select:change` | Selection changed | `{ value: string \| string[] }` |
| `wb:select:open` | Dropdown opened | - |
| `wb:select:close` | Dropdown closed | - |

```javascript
select.addEventListener('wb:select:change', (e) => {
  console.log('Selected:', e.detail.value);
});

select.addEventListener('wb:select:open', () => {
  console.log('Dropdown opened');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-select-height` | `2.5rem` | Select height |
| `--x-select-padding` | `0 0.75rem` | Select padding |
| `--x-select-radius` | `4px` | Border radius |
| `--x-select-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--x-select-border` | `1px solid var(--border-color)` | Border |
| `--x-select-focus-border` | `var(--primary, #6366f1)` | Focus border |
| `--x-select-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--x-select-dropdown-bg` | `var(--bg-surface, #ffffff)` | Dropdown background |
| `--x-select-dropdown-shadow` | `0 4px 12px rgba(0,0,0,0.15)` | Dropdown shadow |
| `--x-select-dropdown-radius` | `4px` | Dropdown radius |
| `--x-select-option-padding` | `0.5rem 0.75rem` | Option padding |
| `--x-select-option-hover-bg` | `var(--bg-secondary)` | Option hover background |
| `--x-select-option-selected-bg` | `var(--primary-light)` | Selected option background |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `combobox` | Always |
| `aria-expanded` | `true/false` | Dynamic |
| `aria-haspopup` | `listbox` | Always |
| `aria-required` | `true` | When required |

Keyboard support:
- `Enter/Space` - Open/select
- `↑/↓` - Navigate options
- `Escape` - Close dropdown
- `Home/End` - First/last option
- Type to search (when searchable)

## Schema

Location: `src/wb-models/select.schema.json`
