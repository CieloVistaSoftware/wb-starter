# Notification Card

Dismissible notification card with variant-based styling

## Type — decorates a semantic element

`x-cardnotification` is the **aside behavior**. It attaches to `<aside>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<aside x-cardnotification
  variant="warning"
  title="Certificate expires in 6 days"
  message="Renew before 26 Aug or the staging domain will start failing TLS."
  dismissible></aside>
```

### On a different element

Use `x-cardnotification` when the host is not a `<aside>` and you want the same behavior:

```html
<div x-cardnotification>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `info` · `success` · `warning` · `error` | `info` | Notification type/severity |
| `title` | `string` | — | Notification title |
| `message` | `string` | — | Notification message |
| `icon` | `string` | — | Custom icon (overrides variant-based icon) |
| `dismissible` | `boolean` | `true` | Show dismiss button |
| `elevated` | `boolean` | `false` | Add shadow elevation |

## Events

- `wb:notification:dismiss` — Fired when notification is dismissed

## Methods

- `show()` — Shows the notification
- `hide()` — Hides the notification
- `toggle()` — Toggles visibility
- `dismiss()` — Dismisses and removes the notification

## Accessibility

- **role** — alert
- **ariaLive** — polite
- **dismissAriaLabel** — Dismiss notification

## Live example

See `x-cardnotification` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardnotification` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardnotification.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
