# Confirm

Behavior applied with x-confirm.

Apply `x-confirm` to any element.

## Usage

```html
<button variant="primary" x-confirm confirm-title="Confirm Action" confirm-message="Are you sure you want to proceed?">Confirm Dialog</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Confirm` | Read by confirm(). |
| `message` | `string` | `Are you sure?` | Read by confirm(). |
| `confirm-text` | `string` | `OK` | Read by confirm(). |
| `cancel-text` | `string` | `Cancel` | Read by confirm(). |
| `confirm-title` | `string` | — | Read by confirm(). |
| `confirm-message` | `string` | — | Read by confirm(). |

## Events

- `wb:confirm:cancel` — Fired by confirm().
- `wb:confirm:ok` — Fired by confirm().

## Live example

See `x-confirm` on the [Behaviors showcase](/?page=behaviors) — search for `x-confirm` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/confirm.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
