# glass — the element carries the background scene

`x-glass` makes an element see-through, so the background scene behind it
passes straight through it and becomes part of it.

In the hero below, look at **Read the Guide**: the wave in the background does
not stop at the button, it runs through the inside of it and out the other
side. That button is `x-glass`. **Try the Playground**, beside it, is solid and
blocks the scene; the difference between the two is the effect.

<div x-demo columns="1">
<section x-cardhero
  background="../../images/placeholder-waves.svg"
  height="280px"
  pretitle="x-glass"
  title="Infinite Possibility."
  cta="Try the Playground"
  cta-secondary="Read the Guide"></section>
</div>

## What it does

The element gets a mostly transparent fill, a faint edge, and a small softening
of what is behind it so its own text stays readable. The element has no picture
of its own: the scene behind it *is* its picture, and it keeps carrying the
scene as the layout moves.

It needs something behind it to carry. Over a flat colour an `x-glass` element
is only a slightly lighter box. Over an image, an SVG scene or a gradient, the
scene shows through.

```html
<button x-glass>Read the Guide</button>
<span x-glass>Zero build</span>
<nav x-glass>…</nav>
```

## Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `amount` | `most` \| `some` \| `least` | `most` | How much of the scene comes through. |

| `amount` | Tint | Scene through | When |
|---|---|---|---|
| `most` | 14% | 86% | The default: the hero's Read the Guide button |
| `some` | 22% | 78% | A busier scene |
| `least` | 30% | 70% | A very busy scene, where the text needs more help |

The tint stops at 30% on purpose. Past that the element stops carrying the
scene and starts hiding it, and light text on it loses contrast against a dark
scene.

```html
<button x-glass amount="least">Read the Guide</button>
```

## Colour

The tint is mixed from `--glass-tint`, which is the theme's text colour by
default, so `x-glass` reads on light and dark themes alike. Set it on a
container to re-tint everything inside: the card hero sets it to its on-accent
white, because its text is white over its artwork in every theme.

| Custom property | Default | What it sets |
|---|---|---|
| `--glass-tint` | `var(--text-primary)` | The colour mixed into the element |
| `--x-glass-edge-width` | `1px` | The faint edge around the element |
| `--x-glass-blur` | `8px` | The softening of the scene behind it |

## What it sets

| Class | When | Effect |
|---|---|---|
| `x-glass` | always | see-through fill, faint edge, softening of the scene behind |
| `x-glass--most` / `--some` / `--least` | from `amount` | how much tint is mixed in |

## Notes

- The card hero's secondary button is `x-glass`. Its tint and edge are the
  hero's own settings; the see-through fill comes from this behavior.
- The old `x-glass` utility class (a rounded glass card with a hover lift) is
  now `x-glass-card`, so it no longer collides with this behavior.
