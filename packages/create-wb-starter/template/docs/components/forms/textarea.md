# Textarea - wb-starter v3.0

Enhanced multi-line text input -- autosize, character counter, and size/variant styling on a bare `<textarea>`.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<textarea>` (deprecated -- see below) |
| Behavior | `textarea` |
| Semantic | `<textarea>` |
| Root CSS Class | `x-textarea` |
| Category | Forms |
| Schema | `src/wb-models/textarea.schema.json` |

> **`<textarea>` is deprecated.** Prefer a bare `<textarea>` directly -- `textarea()` (`src/wb-viewmodels/semantics/textarea.js`) already enhances it fully with no wrapper element needed. `<textarea>` still works (it self-builds a real `<textarea>`) and is documented below for back-compat.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | string | `"default"` | `success`, `error`, ... -- border/ring color |
| `autosize` | boolean | `false` | Auto-grows height to fit content as you type |
| `max-length` | number | `0` (unset) | Character limit shown by the counter |
| `show-count` | boolean | `false` | Shows a live character counter below the field |
| `min-rows` | number | `2` | Minimum height, in rows (used for `min-height` when `autosize`) |
| `max-rows` | number | `10` | Maximum height, in rows, before scrolling (when `autosize`) |
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg`, `xl` |
| `placeholder` | string | `""` | Placeholder text (`<textarea>` form) |
| `rows` | number | `3` | Visible rows (`<textarea>` form) |
| `disabled` | boolean | `false` | Disabled state |
| `required` | boolean | `false` | Required field |

## Usage

### Native `<textarea>` (Recommended)

<div x-demo>
<textarea placeholder="Enter your message..." rows="3"></textarea>
</div>

### Autosize

```html
<textarea placeholder="Grows as you type..." autosize min-rows="2" max-rows="8"></textarea>
```

### Character Count

```html
<textarea placeholder="Limited to 200 characters" max-length="200" show-count></textarea>
```

### Color Variants

```html
<textarea placeholder="Success" variant="success"></textarea>
<textarea placeholder="Error" variant="error"></textarea>
```

### Sizes

```html
<textarea placeholder="Small" size="sm"></textarea>
<textarea placeholder="Large" size="lg"></textarea>
```

### `<textarea>` (Deprecated Form)

```html
<textarea placeholder="Deprecated form" rows="4"></textarea>
```

## Generated Structure

```html
<div class="x-textarea-wrapper">
  <textarea
    class="x-textarea x-textarea--autosize"
    placeholder="Grows as you type...">
  </textarea>
  <div class="x-textarea__counter">0/200</div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-textarea` | Always | Border/background/color/resize behavior |
| `.x-textarea--{variant}` | `variant` (non-`default`) | Border color |
| `.x-textarea--{xs,sm,lg,xl}` | `size` (non-`md`) | Padding/font-size (shares the scale with `.x-input--*`/`.x-select--*`) |
| `.x-textarea--autosize` | `autosize` | Disables manual resize; height is JS-managed |
| `.x-textarea--has-counter` | `show-count` | Marks the field as counter-wrapped |
| `.x-textarea-wrapper` | `show-count` | Structural wrapper around field + counter |
| `.x-textarea__counter` | `show-count` | Live character count text |

## Methods

`textarea()` (`src/wb-viewmodels/semantics/textarea.js`) manages autosize/counter directly via native properties and DOM events -- it does not implement any of the methods below. They come from `textarea.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`) and, since none match the schema builder's common viewModel, each is a stub that dispatches `wb:{method}`. Use the real `<textarea>` element's own native properties/methods instead:

| Method | Description |
|--------|-------------|
| `getValue()` | Declared (generic stub -- read `textarea.value` instead) |
| `setValue(value)` | Declared (generic stub -- set `textarea.value` instead) |
| `clear()` | Declared (generic stub -- set `textarea.value = ''` instead) |
| `focus()` | Declared (generic stub -- use the native `textarea.focus()` instead) |
| `blur()` | Declared (generic stub -- use the native `textarea.blur()` instead) |
| `select()` | Declared (generic stub -- use the native `textarea.select()` instead) |
| `enable()` | Declared (generic stub -- clear the `disabled` attribute instead) |
| `disable()` | Declared (generic stub -- set the `disabled` attribute instead) |

## Events

The real `<textarea>` fires standard native `input`/`change` events, which drive both the autosize resize and the character counter internally:

```javascript
const field = document.querySelector('textarea');

field.addEventListener('input', (e) => console.log('Length:', e.target.value.length));
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--border-color` | Field border | Falls back to `#374151` |
| `--bg-secondary` | Field background | Falls back to `#1f2937` |
| `--text-primary` | Field text | Falls back to `#f9fafb` |
| `--danger-color` | Counter text when over `max-length` | -- |
| `--text-secondary` | Counter text (within limit) | -- |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `required` / `disabled` (real `<textarea>`) | Reflects the matching property |
| Native `<textarea>` semantics | Full native multi-line text field role/keyboard support with zero ARIA needed |

Keyboard support:
- Standard native textarea behavior (typing, selection, `Tab` focus) is unmodified.
