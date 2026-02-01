# Select - wb-starter v3.0

Enhanced select dropdown with search, clear, and multi-select.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-select>` |
| Behavior | `select` |
| Semantic | `<div>` (role="combobox") |
| Base Class | `wb-select` |
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

## Usage

### Custom Element

```html
<wb-select 
  label="Country" 
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'>
</wb-select>
```

### Native Select (Enhanced)

```html
<select data-wb="select">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
```

### With Label

```html
<wb-select 
  label="Choose a language"
  placeholder="Select language..."
  options='[{"value":"en","label":"English"},{"value":"es","label":"Spanish"},{"value":"fr","label":"French"}]'>
</wb-select>
```

### Searchable

```html
<wb-select 
  label="Country"
  searchable
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"},{"value":"ca","label":"Canada"}]'>
</wb-select>
```

### Clearable

```html
<wb-select 
  label="Priority"
  clearable
  options='[{"value":"low","label":"Low"},{"value":"medium","label":"Medium"},{"value":"high","label":"High"}]'>
</wb-select>
```

### Multi-Select

```html
<wb-select 
  label="Tags"
  multiple
  options='[{"value":"bug","label":"Bug"},{"value":"feature","label":"Feature"},{"value":"docs","label":"Documentation"}]'>
</wb-select>
```

### Sizes

```html
<wb-select label="Small" size="sm" options='[...]'></wb-select>
<wb-select label="Medium" size="md" options='[...]'></wb-select>
<wb-select label="Large" size="lg" options='[...]'></wb-select>
```

### Validation States

```html
<wb-select label="Valid" variant="success" options='[...]'></wb-select>
<wb-select label="Error" variant="error" options='[...]'></wb-select>
```

## Generated Structure

```html
<div class="wb-select">
  <label class="wb-select__label">Label</label>
  <button class="wb-select__trigger">
    <span class="wb-select__value">Selected value</span>
    <button class="wb-select__clear">×</button>
    <span class="wb-select__arrow">▼</span>
  </button>
  <div class="wb-select__dropdown">
    <input class="wb-select__search" placeholder="Search...">
    <ul class="wb-select__options">
      <li class="wb-select__option" data-value="1">Option 1</li>
      <li class="wb-select__option wb-select__option--selected" data-value="2">Option 2</li>
    </ul>
  </div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-select` | Always | Base styling |
| `.wb-select--open` | Dropdown open | Open state |
| `.wb-select--searchable` | `searchable` | Has search |
| `.wb-select--clearable` | `clearable` | Has clear button |
| `.wb-select--multiple` | `multiple` | Multi-select mode |
| `.wb-select--sm` | `size="sm"` | Small size |
| `.wb-select--md` | `size="md"` | Medium size |
| `.wb-select--lg` | `size="lg"` | Large size |
| `.wb-select--success` | `variant="success"` | Success state |
| `.wb-select--error` | `variant="error"` | Error state |

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
const select = document.querySelector('wb-select');

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
| `--wb-select-height` | `2.5rem` | Select height |
| `--wb-select-padding` | `0 0.75rem` | Select padding |
| `--wb-select-radius` | `4px` | Border radius |
| `--wb-select-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-select-border` | `1px solid var(--border-color)` | Border |
| `--wb-select-focus-border` | `var(--primary, #6366f1)` | Focus border |
| `--wb-select-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |
| `--wb-select-dropdown-bg` | `var(--bg-surface, #ffffff)` | Dropdown background |
| `--wb-select-dropdown-shadow` | `0 4px 12px rgba(0,0,0,0.15)` | Dropdown shadow |
| `--wb-select-dropdown-radius` | `4px` | Dropdown radius |
| `--wb-select-option-padding` | `0.5rem 0.75rem` | Option padding |
| `--wb-select-option-hover-bg` | `var(--bg-secondary)` | Option hover background |
| `--wb-select-option-selected-bg` | `var(--primary-light)` | Selected option background |

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
