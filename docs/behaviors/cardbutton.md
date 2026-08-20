# Button Card

Card with action buttons in footer

Applies to `<article>`, and to any element carrying `x-cardbutton`.

## Usage

```html
<article x-cardbutton>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Card content/description |
| `primary` | `string` | — | Primary button text |
| `primary-href` | `string` | — | Primary button link URL |
| `secondary` | `string` | — | Secondary button text |
| `secondary-href` | `string` | — | Secondary button link URL |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:cardbutton:primary` — Primary button clicked
- `wb:cardbutton:secondary` — Secondary button clicked

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility

## Live example

See `x-cardbutton` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardbutton` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardbutton.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
