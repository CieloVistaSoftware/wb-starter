# Select - wb-starter v3.0

A real `<select>` (native keyboard nav, mobile picker, form submission, screen-reader semantics) with an optional clearable button. `<wb-select>` is a superset that builds a real `<select>`/`<option>` tree from its attributes or child `<option>` elements, then enhances that.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-select>` |
| Behavior | `select` |
| Semantic | `<select>` |
| Root CSS Class | *(none on `<select>` itself -- styled via the `wb-select`/`select` tag directly; `<wb-select>` host gets `wb-select--{size,variant}` only)* |
| Category | Forms |
| Schema | `src/wb-models/select.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Label shown above the field (`<wb-select>` form) |
| `placeholder` | string | `"Select..."` | Disabled placeholder `<option>` (single-select only) |
| `options` | string (JSON) | `""` | `[{value, label}]` -- used only if no child `<option>` elements exist |
| `value` | string | `""` | Selected value |
| `name` | string | `""` | Form field name |
| `multiple` | boolean | `false` | Allow multiple selection |
| `disabled` | boolean | `false` | Disabled state |
| `required` | boolean | `false` | Required field |
| `size` | string | `"md"` | `sm`, `md`, `lg` |
| `variant` | string | `"default"` | `success`, `error` |
| `clearable` | boolean | `false` | Adds a × button that clears the selection |

## Usage

### Native `<select>` with `<option>` Children

<wb-demo>
<select>
  <option value>Choose...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
</wb-demo>

### `<wb-select>` with `<option>` Children

```html
<wb-select label="Role">
  <option value="admin">Admin</option>
  <option value="editor">Editor</option>
  <option value="viewer">Viewer</option>
</wb-select>
```

### `<wb-select>` from JSON `options`

```html
<wb-select label="Country" options='[{"value":"us","label":"United States"},{"value":"ca","label":"Canada"}]'></wb-select>
```

### Clearable

```html
<select clearable>
  <option value>Choose...</option>
  <option value="1">Option 1</option>
</select>
```

### Variants and Sizes

```html
<wb-select label="Status" variant="success">
  <option value="ok">OK</option>
</wb-select>
<wb-select label="Small" size="sm">
  <option value="a">A</option>
</wb-select>
```

### Multiple

```html
<wb-select label="Tags" multiple>
  <option value="a">A</option>
  <option value="b">B</option>
  <option value="c">C</option>
</wb-select>
```

## Generated Structure

```html
<wb-select class="wb-select--sm">
  <label class="wb-select__label">Role</label>
  <select class="wb-select__field wb-select--sm">
    <option disabled selected value="">Select...</option>
    <option value="admin">Admin</option>
    <option value="editor">Editor</option>
    <option value="viewer">Viewer</option>
  </select>
</wb-select>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `select` (tag selector) | Always | Native `<select>` field styling |
| `.wb-select__field` | `<wb-select>` form | The real `<select>` built inside the host |
| `.wb-select__label` | `label` set | Label above the field |
| `.wb-select--{sm,lg}` | `size` (non-`md`) | Field padding/font-size (also `.wb-input--*`/`.wb-textarea--*` share this scale) |
| `.wb-select--success` / `.wb-select--error` | `variant` | Field border/focus color |
| `.wb-select-clearable` | `clearable` (native-`<select>` form) | Wraps the select + clear button |
| `.wb-select__clear` | `clearable` | Clear (×) button |

## Methods

`select()` (`src/wb-viewmodels/semantics/select.js`) attaches a **real** `wbSelect` API object directly to the element -- these are genuinely implemented, not schema stubs:

| Method | Description |
|--------|-------------|
| `element.wbSelect.getValue()` | Returns `element.value` |
| `element.wbSelect.setValue(v)` | Sets `element.value = v` |
| `element.wbSelect.getSelectedOptions()` | Returns `Array.from(element.selectedOptions)` |
| `element.wbSelect.clear()` | Sets `element.selectedIndex = -1` |

```javascript
const select = document.querySelector('select');

select.wbSelect.setValue('editor');
console.log(select.wbSelect.getValue());
```

`select.schema.json` additionally declares `open`/`close`/`toggle`/`focus`/`enable`/`disable`/`setOptions` under `$methods` for a future custom dropdown UI -- these are **not implemented** by `select.js` today (a real `<select>` has no separate open/close state to control); calling them on a schema-bound element falls back to a generic stub that dispatches `wb:{method}`.

## Events

A real `<select>` fires the native `change` event on selection. The built-in clear button additionally dispatches a native `change` event after clearing:

```javascript
select.addEventListener('change', (e) => console.log('Selected:', e.target.value));
```

`select.schema.json` documents `wb:select:change`/`wb:select:open`/`wb:select:close`, but `select.js` does not dispatch any of them -- listen for the native `change` event instead.

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-primary` | Field background | Shared with `.wb-input`/`.wb-textarea` |
| `--border-color` | Field border | -- |
| `--text-primary` | Field text | -- |
| `--success-color` | `variant="success"` | Border/focus color |
| `--danger-color` | `variant="error"` | Border/focus color |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| Native `<select>` semantics | Full native combobox role, keyboard nav, and mobile picker with zero ARIA needed |
| `aria-labelledby` | Set on the real `<select>`, pointing at the generated `<wb-select>` label id |

Keyboard support:
- Arrow keys, type-ahead, and `Enter`/`Space` all come from the native `<select>` element -- no custom keyboard handling is added.
