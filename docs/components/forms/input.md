# Input - wb-starter v3.0

Enhanced text input -- label, prefix/suffix or icon, clearable button, and validation-state styling.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-input>` |
| Behavior | `input` |
| Semantic | `<input>` |
| Root CSS Class | `wb-input` |
| Category | Forms |
| Schema | `src/wb-models/input.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Label text shown above the field (`<wb-input>` form) |
| `placeholder` | string | `""` | Placeholder text |
| `value` | string | `""` | Initial value |
| `name` | string | `""` | Form field name |
| `input-type` | string | `"text"` | Any native input type: `text`, `email`, `password`, `number`, `tel`, `url`, `search`, `date`, `time`, `datetime-local` |
| `helper` | string | `""` | Helper text shown below the field (hidden when `error` is set) |
| `error` | string | `""` | Error message -- shows the error state |
| `variant` | string | `"default"`/none | `success`, `warning`, `error` -- border/ring color |
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg`, `xl` |
| `disabled` | boolean | `false` | Disabled state |
| `readonly` | boolean | `false` | Read-only state |
| `required` | boolean | `false` | Required field (adds a `*` to the label) |
| `icon` | string | `""` | Icon/emoji shown inside the field |
| `icon-position` | string | `"start"` | `start` or `end` |
| `clearable` | boolean | `false` | Adds a × button that clears the value |

## Usage

### Custom Element

<wb-demo>
<wb-input label="Full name" placeholder="Jane Doe"></wb-input>
</wb-demo>

### Input Types

```html
<wb-input label="Email" input-type="email" placeholder="you@example.com"></wb-input>
<wb-input label="Password" input-type="password" placeholder="••••••••"></wb-input>
```

### Helper and Error Text

```html
<wb-input label="Username" helper="Must be at least 3 characters"></wb-input>
<wb-input label="Username" error="This field is required" variant="error"></wb-input>
```

### With Icon and Clearable

```html
<wb-input label="Search" icon="🔍" placeholder="Search…" clearable></wb-input>
```

### Sizes

```html
<wb-input label="Small" size="sm"></wb-input>
<wb-input label="Large" size="lg"></wb-input>
```

### Native `<input>` (Enhanced)

```html
<!-- x-input is auto-injected onto native text-type <input> tags when autoInject is on -->
<input type="text" placeholder="Enhanced native input" clearable>
```

## Generated Structure

```html
<wb-input>
  <label>Search<span>*</span></label>
  <div class="wb-input__wrapper">
    <span>🔍</span>
    <input type="text" class="wb-input__field" placeholder="Search…">
    <button type="button">✕</button>
  </div>
  <span class="wb-input__helper">Press Enter to search</span>
</wb-input>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-input__wrapper` | Always | Structural flex row (icon + field + clear button); carries no visual styling of its own |
| `.wb-input__field` | Always | The real `<input>` -- border/background/color come from here |
| `.wb-input--{xs,sm,md,lg,xl}` | `size` (non-`md`) | Field padding/font-size |
| `.wb-input--success` / `.wb-input--warning` / `.wb-input--error` | `variant` | Field border color |
| `.wb-input__prefix` / `.wb-input__suffix` | `prefix`/`suffix` (native-input form) | Adornment text |
| `.wb-input__clear` | `clearable` | Clear (×) button |
| `.wb-input__helper` | `helper` set, no `error` | Helper text |
| `.wb-input__error` | `error` set | Error text |

## Methods

`input()` (`src/wb-viewmodels/semantics/input.js`) builds the field/wrapper directly but implements none of the methods below itself -- they come from `input.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`). None match the schema builder's common viewModel, so each is a stub that dispatches `wb:{method}`; use the real `<input>` element's own native properties/methods (`.value`, `.focus()`, `.blur()`, `.select()`) for real behavior.

| Method | Description |
|--------|-------------|
| `getValue()` | Declared (generic stub -- read `input.value` instead) |
| `setValue(value)` | Declared (generic stub -- set `input.value` instead) |
| `clear()` | Declared (generic stub -- the built-in clear button does this for real, via `input.value = ''`) |
| `focus()` | Declared (generic stub -- use the native `input.focus()` instead) |
| `blur()` | Declared (generic stub -- use the native `input.blur()` instead) |
| `select()` | Declared (generic stub -- use the native `input.select()` instead) |
| `setError(message)` | Declared (generic stub -- set the `error` attribute instead) |
| `clearError()` | Declared (generic stub -- remove the `error` attribute instead) |
| `validate()` | Declared (generic stub -- no built-in validation logic) |
| `enable()` | Declared (generic stub -- clear the `disabled` attribute instead) |
| `disable()` | Declared (generic stub -- set the `disabled` attribute instead) |

## Events

The real `<input>` fires standard native events -- `input`, `change`, `focus`, `blur` -- exactly as documented in `input.schema.json`. The built-in clear button additionally dispatches a native `input` event after clearing the value.

```javascript
const field = document.querySelector('wb-input input');

field.addEventListener('input', (e) => console.log('Typed:', e.target.value));
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-primary` | Field background | Falls back to `#1f2937` |
| `--border-color` | Field border | Falls back to `#374151` |
| `--text-primary` | Field text color | Falls back to `#f9fafb` |
| `--success-color` | `variant="success"` border | -- |
| `--warning-color` | `variant="warning"` border | -- |
| `--danger-color` | `variant="error"` border | -- |
| `--radius-md` | Field border radius | Falls back to `6px` |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `required` (real `<input>`) | Reflects the `required` property |
| `disabled` / `readonly` (real `<input>`) | Reflects the matching property |
| Label `<label>` + adjacent `<input>` | Implicit label association (no `for`/`id` wiring needed since the label wraps the field) |

Keyboard support:
- Standard native text-field keyboard behavior (typing, selection, `Tab` focus) is unmodified.
