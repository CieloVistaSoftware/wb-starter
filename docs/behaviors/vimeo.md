# Vimeo

Behavior applied with x-vimeo.

## Type — new capability

`x-vimeo` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-vimeo video-id="76979871"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `video-id` | `string` | — | The numeric Vimeo id — the trailing digits of a vimeo.com URL. This is what identifies the video; without it there is nothing to embed. |
| `autoplay` | `boolean` | `false` | Begin playing on load. Browsers block autoplay with sound, so it needs `muted` to work unattended. |
| `data-autoplay` | `boolean` | `false` | The `data-` spelling of `autoplay`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `autoplay`. |
| `muted` | `boolean` | `false` | Start with audio silenced. Required for `autoplay` to be permitted. |
| `data-muted` | `boolean` | `false` | The `data-` spelling of `muted`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `muted`. |
| `loop` | `boolean` | `false` | Restart from the beginning when playback ends. |
| `data-loop` | `boolean` | `false` | The `data-` spelling of `loop`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `loop`. |

## Live example

See `x-vimeo` on the [Behaviors showcase](/?page=behaviors) — search for `x-vimeo` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/vimeo.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
