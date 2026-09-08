# x-file Behavior

Adds a styled file input. See [src/wb-viewmodels/file.js](../../src/wb-viewmodels/file.js).

- **Type:** Modifier
- **Root CSS class:** `<div x-file>`
- **Schema:** [file.schema.json](../../src/wb-models/file.schema.json)

## Usage

Apply `x-file` to a plain container (`<div>`/`<span>`), **not** to a real
`<input>` — the behavior always builds and appends its own child
`<input type="file">`, and a real `<input>` is a void element that can't hold
appended children (they're silently not rendered).

```html
<div x-file></div>
```

<div x-demo>
<div x-file></div>
</div>

## Properties

None — `file()` takes no configurable attributes.

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `<div x-file>` | the host element | always |
| `x-file__input` | the generated `<input type="file">` | always |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:file:change` | yes | `{ files }` (the input's `FileList`) | The selected file(s) change |

- [Schema](../../src/wb-models/file.schema.json)
- [Source](../../src/wb-viewmodels/file.js)
