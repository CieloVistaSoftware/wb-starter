# Popover

Behavior applied with x-popover.

## Type — new capability

`x-popover` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-popover popover-title="Popover Title" popover-content="This is additional information displayed in a popover.">
  x-popover · variant: primary · popover-title: Popover Title · popover-content: This is additional information displayed in a popover.
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `description` | `string` | `this is the description` | Popover body text. Only used when `popover-content` is absent. |
| `heading` | `string` | `this is the heading` | Popover heading. Only used when `popover-title` is absent. |
| `trigger` | `string` | `click` | What opens it: `click` (default) or `hover`. |
| `position` | `string` | `top` | Side the popover opens on: `top` (default), `bottom`, `left` or `right`. |
| `popover-content` | `string` | `this is the popover content` | Popover body text. Read BEFORE `description`. |
| `popover-title` | `string` | `this is the popover title` | Popover heading. Read BEFORE `heading`. |

## Live example

See `x-popover` on the [Behaviors showcase](/?page=behaviors) — search for `x-popover` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/popover.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
