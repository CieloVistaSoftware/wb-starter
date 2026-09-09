# Img

Behavior applied with x-img.

## Type — new capability

`x-img` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<img src="images/placeholder.svg" alt="Prime lens on a wooden desk">
```



### Declining it

A `<img>` **is** the img behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<img x-ignore>
  <!-- a plain img: no behavior is injected -->
</img>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Image shown while the real `src` loads. Replaced the moment the real image decodes. |
| `fallback` | `string` | — | Image swapped in when `src` fails to load. Without one a broken image raises a loggable error and leaves the element empty. |
| `aspect-ratio` | `string` | — | A CSS aspect ratio (e.g. `16/9`) applied to the element, with `object-fit: cover`. Reserves the box before the image arrives, so the page does not jump as it loads. |
| `lazy` | `boolean` | `false` | Sets `loading="lazy"`, so the browser defers fetching until the image nears the viewport. Bare attribute. |
| `data-lazy` | `boolean` | `false` | The `data-` spelling of `lazy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `lazy`. |
| `zoomable` | `boolean` | `false` | Clicking the image opens it full-size in a lightbox. Bare attribute. |
| `data-zoomable` | `boolean` | `false` | The `data-` spelling of `zoomable`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `zoomable`. |

## Live example

See `x-img` on the [Behaviors showcase](/?page=behaviors) — search for `x-img` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/img.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
