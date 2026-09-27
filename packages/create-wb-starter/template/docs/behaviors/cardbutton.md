# Button Card

`x-cardbutton` renders a card with a title and body text and one or two action buttons in its footer, taken from `primary` and `secondary`. Use it for an offer or prompt that ends in a choice; clicks fire `wb:cardbutton:primary` and `wb:cardbutton:secondary`.

## Usage

<div x-demo>
<article x-cardbutton
  title="Upgrade to Team"
  content="Shared workspaces, audit history and SSO."
  primary="Start free trial"
  secondary="Compare plans"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Card content/description |
| `primary` | `string` | — | Primary button text |
| `primary-href` | `string` | `#` | Primary button link URL |
| `secondary` | `string` | — | Secondary button text |
| `secondary-href` | `string` | `#` | Secondary button link URL |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:cardbutton:primary` — Primary button clicked
- `wb:cardbutton:secondary` — Secondary button clicked

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility

<sub>Schema: [`cardbutton.schema.json`](../../src/wb-models/cardbutton.schema.json)</sub>
