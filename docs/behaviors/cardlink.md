# Link Card

Clickable card that navigates to a URL

Applies to `<article>`, and to any element carrying `x-cardlink`.

## Usage

```html
<article x-cardlink>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `href` | `string` | `https://example.com` | Link destination URL |
| `title` | `string` | — | Card title |
| `description` | `string` | — | Card description text |
| `icon` | `string` | — | Icon (emoji or icon name) |
| `badge` | `string` | — | Badge text |
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

## Live example

See `x-cardlink` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardlink` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardlink.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
