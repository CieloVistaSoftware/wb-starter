# Stack Layout Behavior

Vertical stack layout behavior. Renders children in a column with configurable gap, background color, padding, and border radius.

Apply `x-stack` to any element.

## Usage

```html
<div x-stack>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `gap` | `string` | `1rem` | CSS gap between stacked children. Accepts any valid CSS length value. |
| `bg` | `string` | — | Background color of the stack. Accepts any valid CSS color value including hex, rgb, and CSS variables. |
| `pad` | `string` | — | CSS padding shorthand applied to the stack element. Accepts any valid CSS padding value (1–4 values). Use '0 0 0.75rem' to pad bottom only (e.g. when image bleeds to top/side edges). |
| `radius` | `string` | — | CSS border-radius applied to the stack element. Accepts any valid CSS border-radius value. |

## Live example

See `x-stack` on the [Behaviors showcase](/?page=behaviors) — search for `x-stack` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/stack.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
