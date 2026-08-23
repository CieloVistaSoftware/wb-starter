# x-colorpicker Behavior

Turns a field into a native color picker. See
[src/wb-viewmodels/colorpicker.js](../../src/wb-viewmodels/colorpicker.js).

- **Type:** Modifier
- **Root CSS class:** `<div x-colorpicker>`
- **Schema:** [colorpicker.schema.json](../../src/wb-models/colorpicker.schema.json)

## Usage

Applied to a real `<input>`, the input itself is converted in place to
`type="color"` (its existing `value` is kept, so `value="#22c55e"` on the
element becomes the swatch's starting color) — no separate child input is
created, since an `<input>` can't hold children:

```html
<input type="text" x-colorpicker value="#22c55e">
```

<wb-demo>
<input type="text" x-colorpicker value="#22c55e">
</wb-demo>

Applied to a non-input container instead, it builds its own child
`<input type="color">` inside the element:

```html
<div x-colorpicker value="#6366f1"></div>
```

<wb-demo>
<div x-colorpicker value="#6366f1"></div>
</wb-demo>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `value` | string (hex color) | `#000000` | Initial color. On a real `<input>` target this is just the input's native `value`; on a container target it seeds the generated child color input. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `<div x-colorpicker>` | the target element | always |
| `wb-colorpicker__input` | the `<input type="color">` (the target itself when it's an `<input>`, otherwise the generated child) | always |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:colorpicker:change` | yes | `{ value }` | The color value changes |

- [Schema](../../src/wb-models/colorpicker.schema.json)
- [Test](../../tests/behaviors/colorpicker-input-target.spec.ts)
- [Source](../../src/wb-viewmodels/colorpicker.js)
