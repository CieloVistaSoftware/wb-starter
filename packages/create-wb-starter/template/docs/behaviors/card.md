# Card Behavior

Card behavior. IS-A article, HAS-A header, main, footer.

Applies to `<article>`, and to any element carrying `x-card`.

## Usage

```html
<article>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title displayed in header |
| `subtitle` | `string` | — | Card subtitle displayed below title |
| `footer` | `string` | — | Card footer text |
| `elevated` | `boolean` | `false` | Add drop shadow |
| `clickable` | `boolean` | `false` | Make card clickable |
| `variant` | `default` · `glass` · `bordered` · `flat` | `default` | Visual style variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` | Card size variant controlling max/min width |
| `tooltip` | `string` | — | Hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip. `hoverText`/`hover-text` is the pre-existing documented alias and wins only when `tooltip` is unset (#283). |
| `hover-text` | `string` | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip, not the native browser title tooltip. |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles card visibility
- `update()` — Updates card properties

## Live example

See `x-card` on the [Behaviors showcase](/?page=behaviors) — search for `x-card` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/card.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
