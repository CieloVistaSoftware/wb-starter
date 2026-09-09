# Mark

Behavior applied with x-mark.

## Type — new capability

`x-mark` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<p>Search matched <mark>light DOM</mark> in 12 documents.</p>
```



### Declining it

A `<mark>` **is** the mark behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<mark x-ignore>
  <!-- a plain mark: no behavior is injected -->
</mark>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `string` | — | Semantic highlight colour: `success`, `warning`, `danger` or `info`. **Ignored when `color` is set** — an explicit colour wins. |
| `color` | `string` | — | Any CSS colour, used as the highlight background. The text colour is computed from its luminance so the mark stays readable, and setting this overrides `variant`. |

## Live example

See `x-mark` on the [Behaviors showcase](/?page=behaviors) — search for `x-mark` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/mark.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
