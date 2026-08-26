# x-counter Behavior

Displays a live `length/max` character counter beneath a text field and
enforces the limit via the native `maxlength`. See
[src/wb-viewmodels/counter.js](../../src/wb-viewmodels/counter.js).

- **Type:** Modifier
- **Root CSS class:** `<div x-counter>`
- **Schema:** [counter.schema.json](../../src/wb-models/counter.schema.json)

## Usage

```html
<input type="text" x-counter max="50" placeholder="Type here — counts up to 50">
```

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<input type="text" x-counter max="50" placeholder="Type here — counts up to 50">
</div>

Add `warning` for a threshold that turns the counter into a warning state
before the field is actually full:

<div x-demo>
<textarea x-counter max="120" warning="90" placeholder="Tell us about yourself" rows="3"></textarea>
</div>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `max` | integer | the field's existing `maxlength`, or `0` (no limit) | Maximum character count. When set, the behavior also sets the element's native `maxLength` so the browser refuses further input past the limit. |
| `warning` | integer | `0` (no warning state) | Character count at which `x-counter--warning` is applied. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `<div x-counter>` | the generated `<span>` counter | always |
| `x-counter--warning` | the counter `<span>` | length ≥ `warning` |
| `x-counter--error` | the counter `<span>` | `max` is set and length ≥ `max` |

## Events

None — the counter re-renders on the field's native `input` event; it doesn't dispatch any of its own.

- [Schema](../../src/wb-models/counter.schema.json)
- [Source](../../src/wb-viewmodels/counter.js)
