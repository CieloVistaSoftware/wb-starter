# Notification Card

`x-cardnotification` renders a notice card coloured by `variant` (info, success, warning, error), with an icon, title, message and a dismiss button that removes it. Use it for a message tied to a place on the page.

## Usage

<div x-demo>
<aside x-cardnotification
  variant="warning"
  title="Certificate expires in 6 days"
  message="Renew before 26 Aug or the staging domain will start failing TLS."
  dismissible></aside>
</div>

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

<sub>Schema: [`cardnotification.schema.json`](../../src/wb-models/cardnotification.schema.json)</sub>
