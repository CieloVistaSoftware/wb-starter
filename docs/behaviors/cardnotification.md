# Notification Card

Dismissible notification card with variant-based styling

Applies to `<aside>`, and to any element carrying `x-cardnotification`.

## Usage

```html
<aside x-cardnotification>
  …
</aside>
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
