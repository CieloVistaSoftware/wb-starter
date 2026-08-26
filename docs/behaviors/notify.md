# Notify

Behavior applied with x-notify.

## Type — new capability

`x-notify` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button x-notify message="Deploy finished — staging is live." variant="success">
  x-notify · message: Deploy finished — staging is live. · variant: success
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `message` | `string` | `Notification` | Read by notify(). |
| `duration` | `string` | `3000` | Read by notify(). |

## Events

- `wb:notify:show` — Fired by notify().

## Live example

See `x-notify` on the [Behaviors showcase](/?page=behaviors) — search for `x-notify` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/notify.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
