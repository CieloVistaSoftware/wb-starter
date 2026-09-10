# Confirm

Behavior applied with x-confirm.

## Type — new capability

`x-confirm` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-confirm confirm-title="Confirm Action" confirm-message="Are you sure you want to proceed?">
  x-confirm · variant: primary · confirm-title: Confirm Action · confirm-message: Are you sure you want to proceed?
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Confirm` | Dialog heading. Only used when `confirm-title` is absent. |
| `message` | `string` | `Are you sure?` | Body text. Only used when `confirm-message` is absent. |
| `confirm-text` | `string` | `OK` | Label on the confirming button. Defaults to `OK`. |
| `cancel-text` | `string` | `Cancel` | Label on the dismissing button. Defaults to `Cancel`. |
| `confirm-title` | `string` | `this is the confirm title` | Dialog heading. Read BEFORE `heading`; defaults to `Confirm`. |
| `confirm-message` | `string` | `this is the confirm message` | Body text. Read BEFORE `message`; defaults to `Are you sure?`. |

## Events

- `wb:confirm:cancel` — Fired by confirm().
- `wb:confirm:ok` — Fired by confirm().

## Live example

See `x-confirm` on the [Behaviors showcase](/?page=behaviors) — search for `x-confirm` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/confirm.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
