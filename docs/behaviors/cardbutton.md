# Button Card

`x-cardbutton` renders a card with a title and body text and one or two action buttons in its footer, taken from `primary` and `secondary`. Use it for an offer or prompt that ends in a choice; clicks fire `wb:cardbutton:primary` and `wb:cardbutton:secondary`.

## Usage

<div x-demo>
<article x-cardbutton
  title="Upgrade to Team"
  primary="Start free trial"
  secondary="Compare plans">Shared workspaces, audit history and SSO.</article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | text | — | Card title |
| `content` | text or HTML | — | Card content/description |
| `primary` | text | — | Primary button text |
| `primaryHref` | URL | `#` | Primary button link URL |
| `secondary` | text | — | Secondary button text |
| `secondaryHref` | URL | `#` | Secondary button link URL |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:cardbutton:primary` — Primary button clicked (a button with no primaryHref)
- `wb:cardbutton:secondary` — Secondary button clicked (a button with no secondaryHref)

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility

<sub>Schema: [`cardbutton.schema.json`](../../src/wb-models/cardbutton.schema.json)</sub>
