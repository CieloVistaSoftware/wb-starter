# Notify

Behavior applied with x-notify.

Apply `x-notify` to any element.

## Usage

```html
<button x-notify message="Deploy finished — staging is live." variant="success">Notify me</button>
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
