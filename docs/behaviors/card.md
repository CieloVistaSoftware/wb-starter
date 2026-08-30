# Card

Card. Composes an article with a header, main and footer.

Every card variant composes this same structure — they do not inherit it.
There is no behavior base class (TIER1-LAWS §2): `composeCard()` is a function
each variant calls, and the variants below are separate behaviors that decorate
an element in place, exactly as `x-ripple` does.

## Type — semantic

`<article>` already means "self-contained composition", so an `<article>` **is**
a card: auto-injection applies the behavior with no attribute needed. Write the
attribute explicitly when you want a card on some other element, or when you
want the intent to be obvious at the call site.

### How to write it

```html
<article title="Card title" subtitle="A line under it" footer="Footer text"></article>
```

Explicitly, or on a non-article element:

```html
<div x-card
  title="Card title"
  subtitle="A line under it"
  footer="Footer text"
  elevated></div>
```

Only the parts you give it are rendered. A card with no `title`/`subtitle` gets
no header; a card with no `footer` gets no footer. Nothing is emitted empty.

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `""` | Card title displayed in header |
| `subtitle` | `string` | `""` | Card subtitle displayed below title |
| `footer` | `string` | `""` | Card footer text |
| `elevated` | `boolean` | `false` | Add drop shadow |
| `clickable` | `boolean` | `false` | Make card clickable |
| `variant` | `default` · `glass` · `bordered` · `flat` | `default` | Visual style variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` | Card size variant controlling max/min width |
| `tooltip` | `string` | `""` | Hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip. `hoverText`/`hover-text` is the pre-existing documented alias and wins only when `tooltip` is unset (#283). |
| `hover-text` | `string` | `""` | Alias for `tooltip` — hover text shown as a themed WB tooltip, not the native browser title tooltip. |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles card visibility
- `update(options)` — Updates card properties

## Styling

Base class is `x-card`. The structural parts are `x-card__header`,
`x-card__main` and `x-card__footer`.

Style through the existing card stylesheet in `src/styles/behaviors/`, never a
one-off class or inline style (TIER1-LAWS §9). `variant` and `size` are the
supported knobs — reach for those before writing new CSS.

## Accessibility

- Support level: **stable**, accessibility: **high**
- Renders as `<article>`, which carries the `article` role — so a card is a
  landmark a screen reader can navigate to. Give it a `title` so that landmark
  has a name.
- `clickable` makes the whole card activatable; it must remain reachable and
  operable by keyboard, not mouse only.

## Variants

The card variants are separate behaviors, each with its own page:

[cardbutton](cardbutton.md) · [carddraggable](carddraggable.md) ·
[cardexpandable](cardexpandable.md) · [cardfile](cardfile.md) ·
[cardhero](cardhero.md) · [cardhorizontal](cardhorizontal.md) ·
[cardimage](cardimage.md) · [cardlink](cardlink.md) ·
[cardminimizable](cardminimizable.md) · [cardnotification](cardnotification.md) ·
[cardoverlay](cardoverlay.md) · [cardportfolio](cardportfolio.md) ·
[cardpricing](cardpricing.md) · [cardproduct](cardproduct.md) ·
[cardprofile](cardprofile.md) · [cardstats](cardstats.md) ·
[cardtestimonial](cardtestimonial.md) · [cardvideo](cardvideo.md)

## Live example

See `x-card` on the [Behaviors showcase](/?page=behaviors) — search for `x-card`
to run it and copy its markup.

---

<sub>Hand-written to match `src/wb-models/card.schema.json` (#892). Attribute
names, defaults and methods are the declared ones. `scripts/generate-behavior-docs.mjs`
never overwrites an existing doc, so expand this file by hand.</sub>
