# Figure

Behavior applied with x-figure.

## Type — new capability

`x-figure` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<figure>
  <img src="images/placeholder.svg" alt="Suspension bridge in fog">
  <figcaption>The 6am crossing, before the fog lifted.</figcaption>
</figure>
```



### Declining it

A `<figure>` **is** the figure behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<figure x-ignore>
  <!-- a plain figure: no behavior is injected -->
</figure>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `caption-position` | `string` | `bottom` | Where the caption sits: `bottom` (default) places it beneath the image; `overlay` positions it absolutely across the bottom of the image on a translucent dark bar. |
| `zoom` | `boolean` | `false` | Clicking the image opens it at full size. Bare attribute. |
| `lightbox` | `string` | — | Open the image in a lightbox on click. **On by default** — this is opt-OUT, so write `lightbox="false"` to disable it. |
| `caption` | `string` | — | Caption text. Sets the `<figcaption>` content, creating one if the figure has none. |

## Live example

See `x-figure` on the [Behaviors showcase](/?page=behaviors) — search for `x-figure` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/figure.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
