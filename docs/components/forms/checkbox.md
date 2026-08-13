# Checkbox - wb-starter v3.0

Custom-styled `<input type="checkbox">` -- appearance-driven, no wrapper element, with size/color variants and indeterminate support.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-checkbox>` (deprecated -- see below) |
| Behavior | `checkbox` |
| Semantic | `<input type="checkbox">` |
| Root CSS Class | *(none -- styles target `input[type="checkbox"]` directly)* |
| Category | Forms |
| Schema | `src/wb-models/checkbox.schema.json` |

> **`<wb-checkbox>` is deprecated.** Prefer a bare `<input type="checkbox">` directly -- `checkbox()` (`src/wb-viewmodels/semantics/checkbox.js`) already enhances it fully via `appearance: none`, with no wrapper element needed. `<wb-checkbox>` still works (it self-builds a real `<input type="checkbox">` inside a `<label>`) and is documented below for back-compat.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | boolean | `false` | Checked state |
| `disabled` | boolean | `false` | Disabled state |
| `indeterminate` | boolean | `false` | Indeterminate visual state (a DOM property, set via JS) |
| `name` | string | `""` | Form field name |
| `value` | string | `""` | Form field value |
| `required` | boolean | `false` | Required field |
| `size` | string | `"md"`* | `xs`, `sm`, `lg` via attribute (native input CSS) |
| `variant` | string | `"default"` | `success`, `warning`, `danger` via attribute (checked/indeterminate accent color) |
| `label` | string | `""` | Label text (`<wb-checkbox>` form only) |

\* Native-input sizing is driven by the `size="…"` attribute directly in `checkbox.js`'s injected CSS (`xs`/`sm`/`lg`; omit the attribute for the default size).

## Usage

### Native Input (Recommended)

<wb-demo>
<label><input type="checkbox"> Unchecked</label>
</wb-demo>

### Checked / Disabled

```html
<label><input type="checkbox" checked> Checked</label>
<label><input type="checkbox" disabled> Disabled</label>
```

### Color Variants

```html
<label><input type="checkbox" checked variant="success"> Success</label>
<label><input type="checkbox" checked variant="warning"> Warning</label>
<label><input type="checkbox" checked variant="danger"> Danger</label>
```

### Sizes

```html
<label><input type="checkbox" size="xs"> Extra small</label>
<label><input type="checkbox" size="sm"> Small</label>
<label><input type="checkbox" size="lg"> Large</label>
```

### `<wb-checkbox>` (Deprecated Form)

```html
<wb-checkbox label="Accept terms" variant="success"></wb-checkbox>
```

## Generated Structure

```html
<!-- native form: no wrapper, styled directly -->
<label>
  <input type="checkbox" checked variant="success">
  Success
</label>

<!-- <wb-checkbox> form: self-builds the real input -->
<wb-checkbox class="wb-checkbox">
  <label>
    <input type="checkbox">
    Accept terms
  </label>
</wb-checkbox>
```

## CSS Classes

`checkbox.js` adds no classes to the native `input[type="checkbox"]` -- all visual states are matched by tag + pseudo-class + attribute selectors:

| Selector | Applied When | Description |
|----------|--------------|-------------|
| `input[type="checkbox"]` | Always | Base `appearance: none` box |
| `input[type="checkbox"]:checked` | Checked | Filled background + checkmark icon |
| `input[type="checkbox"]:indeterminate` | `element.indeterminate = true` | Filled background + dash icon |
| `input[type="checkbox"]:focus-visible` | Keyboard focus | Focus ring |
| `input[type="checkbox"]:disabled` | `disabled` | Reduced opacity, no pointer |
| `input[type="checkbox"][size="xs\|sm\|lg"]` | `size` attribute | Box dimensions |
| `input[type="checkbox"][variant="success\|warning\|danger"]` | `variant` attribute | Checked/indeterminate accent color |
| `.wb-checkbox` | `<wb-checkbox>` host | Applied to the deprecated custom-tag wrapper only |

## Methods

`checkbox()` itself performs only one JS action: setting `element.indeterminate = true` when requested. The methods below come from `checkbox.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`) onto a `<wb-checkbox>` host. `toggle()` resolves to the schema builder's real generic implementation (toggles `element.hidden`, **not** the checked state); the rest have no matching generic implementation and are stubs that dispatch `wb:{method}`.

| Method | Description |
|--------|-------------|
| `check()` | Declared (generic stub -- dispatches `wb:check`; set `.checked = true` on the real input instead) |
| `uncheck()` | Declared (generic stub -- dispatches `wb:uncheck`) |
| `toggle()` | Generic visibility toggle (`element.hidden`) -- not a checked-state toggle |
| `isChecked()` | Declared (generic stub -- dispatches `wb:isChecked`; read `input.checked` instead) |
| `enable()` | Declared (generic stub -- dispatches `wb:enable`) |
| `disable()` | Declared (generic stub -- dispatches `wb:disable`) |

For real checked-state control, use the native input directly: `input.checked = true` / `input.indeterminate = true`.

## Events

`checkbox.js` dispatches no custom events -- listen for the native `change`/`input` events the browser already fires on any checkbox:

```javascript
document.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
  console.log('Checked:', e.target.checked);
});
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--wb-checkbox-bg` | Unchecked background | Falls back to `var(--bg-surface, #ffffff)` (declared in schema; injected CSS uses `var(--bg-primary, #fff)` directly) |
| `--border-color` | Unchecked border | Falls back to `#d1d5db` |
| `--primary` | Checked background/border | Falls back to `#6366f1` |
| `--success-color` / `--warning-color` / `--danger-color` | `variant="success"`/`"warning"`/`"danger"` | Checked/indeterminate accent + focus ring |
| `--text-primary` | N/A (reserved) | Declared in the component's schema `$cssAPI` |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| Native `<input type="checkbox">` semantics | Full native checkbox role/state/keyboard support with zero ARIA needed |
| `.indeterminate` (DOM property) | Announced by assistive technology as a mixed/partial state |

Keyboard support:
- `Space` toggles a focused checkbox, `Tab`/`Shift+Tab` moves focus -- both are native browser behavior, unmodified by this behavior.
