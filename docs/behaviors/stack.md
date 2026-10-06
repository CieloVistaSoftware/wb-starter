# Stack Layout Behavior

`x-stack` lays its children out in a single column with `gap` between them, and can set a background (`bg`), padding (`pad`) and corner `radius` on the stack itself.

## Usage

<div x-demo>
<div x-stack gap="0.75rem" pad="1rem" radius="8px" bg="bg-secondary">
  <div>Queued</div>
  <div>Running</div>
  <div>Passed</div>
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `gap` | `string` | `1rem` | CSS gap between stacked children. Accepts any valid CSS length value. |
| `bg` | `string` | — | Background of the stack: a theme colour name (`bg-primary`, `bg-secondary`, `bg-tertiary`, `primary`, `success`, …) or any CSS colour (hex, rgb, hsl). |
| `pad` | `string` | — | CSS padding shorthand applied to the stack element. Accepts any valid CSS padding value (1–4 values). Use '0 0 0.75rem' to pad bottom only (e.g. when image bleeds to top/side edges). |
| `radius` | `string` | — | CSS border-radius applied to the stack element. Accepts any valid CSS border-radius value. |

<sub>Schema: [`stack.schema.json`](../../src/wb-models/stack.schema.json)</sub>
