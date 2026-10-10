# Alert

`x-alert` builds an inline alert box from its `message`, `title` and `variant` attributes, with a severity icon and colour, and an optional close button when `dismissible` is set. Use it for a message that belongs in the page flow; for one that should float and go away on its own, use `x-toast` or `x-notify`.

## Usage

<figure x-demo>
<div x-alert variant="warning" title="Staging is read-only" message="Deploys are paused until the 14:00 migration finishes." dismissible></div>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `info` · `success` · `warning` · `error` | `info` | Alert severity/style variant |
| `title` | text | — | Alert title (optional heading) |
| `message` | text | — | Alert message content. Text between the tags wins over it ([content wins](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md#primary-value-content-wins), #417). |
| `icon` | emoji or icon name | — | Icon (emoji or icon name) |
| `dismissible` | `boolean` | `false` | Show close button to dismiss alert |

## Methods

- `show()` — Shows the alert
- `hide()` — Hides the alert
- `toggle()` — Toggles alert visibility
- `dismiss()` — Dismisses and removes the alert with animation

<sub>Schema: [`alert.schema.json`](../../src/wb-models/alert.schema.json)</sub>
