# Link Card

`x-cardlink` renders a card that is itself a link to `href`: the whole surface is clickable and keyboard-focusable, with a title, description, optional icon and badge. Use it for navigation tiles.

## Usage

<div x-demo>
<article x-cardlink
  href="#"
  title="Attribute naming standard"
  description="Why every attribute is kebab-case, and what breaks when it is not."
  badge="Standard"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `href` | URL | `https://example.com` | Link destination URL |
| `title` | text | — | Card title |
| `description` | text | — | Card description text |
| `icon` | emoji or icon name | — | Icon (emoji or icon name) |
| `badge` | text | — | Badge text |
| `target` | `_self` · `_blank` | `_self` | Link target |
| `variant` | `default` · `elevated` · `bordered` · `minimal` · `glass` | `default` | Visual style variant |

## Events

- `wb:cardlink:click` — Fired when card is clicked

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `navigate()` — Triggers navigation to href
- `setHref()` — Updates the href

## Accessibility

- **role** — link
- **tabindex** — 0

<sub>Schema: [`cardlink.schema.json`](../../src/wb-models/cardlink.schema.json)</sub>
