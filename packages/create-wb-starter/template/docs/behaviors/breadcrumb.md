# Breadcrumb

Behavior applied with x-breadcrumb.

## Type — new capability

`x-breadcrumb` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<nav x-breadcrumb items="Home,Products,Electronics,Smartphones"></nav>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | `string` | — | Read by breadcrumb(). |
| `separator` | `string` | `/` | Read by breadcrumb(). |

## Live example

See `x-breadcrumb` on the [Behaviors showcase](/?page=behaviors) — search for `x-breadcrumb` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/breadcrumb.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
