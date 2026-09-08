# Pagination

Behavior applied with x-pagination.

## Type — new capability

`x-pagination` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<nav x-pagination total="100" per-page="10" current="5"></nav>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `total` | `string` | `0` | Read by pagination(). |
| `per-page` | `string` | `10` | Read by pagination(). |
| `pages` | `string` | `0` | Read by pagination(). |
| `current` | `string` | `1` | Read by pagination(). |
| `aria-disabled` | `string` | — | Read by pagination(). |
| `action` | `string` | — | Read by pagination(). |
| `page` | `string` | — | Read by pagination(). |

## Events

- `wb:pagination:change` — Fired by pagination().

## Live example

See `x-pagination` on the [Behaviors showcase](/?page=behaviors) — search for `x-pagination` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/pagination.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
