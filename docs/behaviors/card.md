# Card

Card. Composes an article with a header, main and footer.

Every card variant composes this same structure — they do not inherit it.
There is no behavior base class (TIER1-LAWS §2): `composeCard()` is a function
each variant calls, and the variants below are separate behaviors that decorate
an element in place, exactly as `x-ripple` does.

## Usage

<div x-demo>
<article title="Card title" subtitle="A line under it" footer="Footer text"></article>
</div>

Explicitly, or on a non-article element:

<div x-demo>
<div x-card
  title="Card title"
  subtitle="A line under it"
  footer="Footer text"
  elevated></div>
</div>

Only the parts you give it are rendered. A card with no `title`/`subtitle` gets
no header; a card with no `footer` gets no footer. Nothing is emitted empty.

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `""` | Card title displayed in header |
| `subtitle` | `string` | `""` | Card subtitle displayed below title |
| `author` | `string` | `""` | Author name, rendered as the card's byline in an `<address>` |
| `date` | `string` | `""` | Publication date, rendered in a `<time>` element |
| `category` | `string` | `""` | Category or tag shown above the title |
| `readingTime` | `string` | `""` | Estimated reading time |
| `footer` | `string` | `""` | Card footer text |
| `elevated` | `boolean` | `false` | Add drop shadow |
| `clickable` | `boolean` | `false` | Make card clickable |
| `variant` | `default` · `glass` · `bordered` · `flat` | `default` | Visual style variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` | Card size variant controlling max/min width |
| `tooltip` | `string` | `""` | Hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip. `hoverText` is the pre-existing documented alias and wins only when `tooltip` is unset (#283). |
| `hoverText` | `string` | `""` | Alias for `tooltip` — hover text shown as a themed WB tooltip, not the native browser title tooltip. |
| `featured` | `boolean` or `string` | `false` | Promotes this card over its siblings: a heavier border and a visible marker. Bare `featured` prints "Featured"; `featured="Deal of the week"` prints that label instead. |
| `content` | `string` | `""` | Body text. When both are given, `content="…"` wins over the text between the tags, and the children are not rendered (#683). A card with no content at all gets no body box. |

### An article is a card

There is no separate article behavior. A blog post, news item or doc page is an
`<article>`, so it is a card, and the byline attributes above are how it says who
wrote it and when:

<div x-demo>
<article title="Ada on Engines" author="Ada Lovelace"
  date="1843-10-01" category="Computing" readingTime="7 min">
  The Engine weaves algebraic patterns as the loom weaves flowers.
</article>
</div>

### Badge

`badge` puts a short label in the header's right-hand column:

<div x-demo>
<article title="Release 4.2" badge="NEW">
  Lazy loading is now the default runtime.
</article>
</div>

### Variants

`variant="glass"` frosts the surface so whatever sits behind the card shows
through, blurred:

<div x-demo>
<article title="Glass" variant="glass">
  Frosted surface over the page background.
</article>
</div>

`variant="bordered"` drops the fill and keeps a heavier outline, for cards
sitting on a busy surface:

<div x-demo>
<article title="Bordered" variant="bordered">
  Outline only; the page shows through.
</article>
</div>

### Elevated

`elevated` lifts the card off the page with a drop shadow:

<div x-demo>
<article title="Elevated" elevated>
  Raised above its neighbours.
</article>
</div>

### Clickable

`clickable` makes the whole card one control: it takes focus, and Enter or
Space activates it the same as a click.

<div x-demo>
<article title="Open the report" clickable>
  Anywhere on this card opens it.
</article>
</div>

### Tooltip

`tooltip` shows its text in a themed tooltip on hover:

<div x-demo>
<article title="Hover me" tooltip="Updated two minutes ago">
  Point at the card to see when it last changed.
</article>
</div>

### Featured

`featured` promotes one card over its siblings; give it a value to say why:

<div x-demo>
<article title="Trail boots" featured="Deal of the week">
  Waterproof, resoleable, 20% off until Sunday.
</article>
</div>

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles card visibility
- `update(options)` — Updates card properties

## Styling

The card's own parts carry no classes. `card.css` names each one by its tag
and position, so the markup is exactly what it looks like:

```text
<article>                ← the CARD (any element with x-card works the same)
  <header>               ← the HEADER: article > header
    <h3>                 ← the TITLE, from `title`: article > header > h3
    <p>                  ← the SUBTITLE, from `subtitle`: article > header > p
    <span>               ← the BADGE, from `badge`: article > header > span:last-child
  <div class="x-card__body">  ← the BODY, your content (#945)
  <footer>               ← the FOOTER, from `footer`: .x-card__footer
```

The body and the footer are the two parts named by class. The body is a
`<div>`, not a `<main>`: HTML only allows `<main>` under `html`, `body`, `div`
or `form`, so a `<main>` inside a card is invalid, and an authored `<main>`
becomes this same `<div class="x-card__body">` (#945). `variant`, `elevated` and
`clickable` are read straight off the element as attributes
(`article[variant="glass"]`); `size` becomes an `x-card--{size}` class.

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

to run it and copy its markup.

---

<sub>Hand-written to match `src/wb-models/card.schema.json` (#892). Attribute
names, defaults and methods are the declared ones. `scripts/generate-behavior-docs.mjs`
never overwrites an existing doc, so expand this file by hand.</sub>

<sub>Schema: [`card.schema.json`](../../src/wb-models/card.schema.json)</sub>
