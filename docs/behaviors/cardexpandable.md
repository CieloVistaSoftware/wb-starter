# Expandable Card

`x-cardexpandable` renders a card whose body is clipped to `lines` lines (or `maxHeight`) with a control that expands it to full length and back. Use it for long descriptions in a grid of cards that should line up.

## Usage

<div x-demo>
<article x-cardexpandable
  title="What changed in 4.0"
  lines="2">Composition replaced inheritance: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no component base class any more, and no shadow boundary to reach through. Behaviors load on demand, so a page pays only for the ones it uses. Every attribute is declared in a schema, and that one schema drives validation, editor IntelliSense and these docs. Themes flow from a single set of variables, so changing one value recolors every behavior on the page. And there is still no build step: add the script tag and the browser does the rest.</article>
</div>

## When Show More appears

Show More only appears when the collapsed card is hiding something. If the
content already fits inside `lines` or `maxHeight` (a short text, or a card wide
enough that the text wraps to fewer lines than the limit), there is nothing to
reveal, so the card shows no button. It checks again whenever its width or
content changes, and brings the button back once something is hidden. An
expanded card always keeps its button, so it can collapse again.

So an example of this card needs more content than its collapsed limit shows.
A sentence or two under `lines="2"` fits in two lines on any wide screen and
demonstrates nothing.

## What happened (#1598, October 2026)

Every x-cardexpandable example on the Behaviors page, and the seven on the
cards demo page, had one short sentence or `content="Content"`. At the
preview's width each one fit inside its collapsed limit (69px collapsed and
69px expanded), so Show More flipped its label and arrow and revealed nothing.
John: "None of these show anything in the expanded area."

The same symptom had been reported before and traced to the cards demo being
too wide for its text. That fix narrowed that one demo (`size="sm"`), and its
test (`tests/regression/x-cardexpandable-toggle-visibly-changes.spec.ts`) checks
one hand-built narrow card on the `maxHeight` path. It never rendered the
real examples, or the `lines` clamp they use, so it stayed green while they
were broken.

The fix:

- The examples (`data/behavior-examples.json`, `demos/site/cards.html`, the
  playground) now carry enough content to overflow their limit at any preview
  width.
- The card hides Show More when there is nothing to reveal (above), so a short
  card no longer offers a toggle that does nothing.
- `tests/regression/x-cardexpandable-examples-reveal-content.spec.ts` renders
  every catalogue example and every cards-page demo at 1100px and 1600px. Each
  must hide content when collapsed and grow on Show More, and a card whose
  content fits must show no toggle.

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Expandable content |
| `expanded` | `boolean` | `false` | Initial expanded state |
| `maxHeight` | `string` | `100px` | Max height when collapsed (pixel/unit string). Ignored when `lines` is set -- use maxHeight for non-text/mixed content where line-clamp doesn't apply. |
| `lines` | `number` | `null` | Clamp collapsed text to exactly N full lines via CSS line-clamp, instead of an arbitrary pixel maxHeight. Takes priority over maxHeight when set. |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:cardexpandable:toggle` — Fired on expand and collapse. Bubbles.

## Methods

- `show()` — Expands the card. On `element.wbCardExpandable`; read the state from `element.wbCardExpandable.expanded`.
- `hide()` — Collapses the card. On `element.wbCardExpandable`.
- `toggle()` — Expands a collapsed card, collapses an expanded one. On `element.wbCardExpandable`.

<sub>Schema: [`cardexpandable.schema.json`](../../src/wb-models/cardexpandable.schema.json)</sub>
