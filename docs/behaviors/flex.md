# Flex

Behavior applied with x-flex.

## Type — new capability

`x-flex` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-flex gap="1rem">
  <div>First</div><div>Second</div><div>Third</div>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `string` | `row` | Read by flex(). |
| `wrap` | `string` | `wrap` | Read by flex(). |
| `justify` | `string` | `flex-start` | Read by flex(). |
| `align` | `string` | `stretch` | Read by flex(). |
| `gap` | `string` | `1rem` | Read by flex(). |

## Live example

See `x-flex` on the [Behaviors showcase](/?page=behaviors) — search for `x-flex` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/flex.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
