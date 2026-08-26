# Video

Behavior applied with x-video.

## Type — new capability

`x-video` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<video src="https://www.w3schools.com/html/mov_bbb.mp4" poster="https://picsum.photos/seed/screening/640/360" controls></video>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `poster` | `string` | — | Read by video(). |
| `controls` | `string` | — | Read by video(). |
| `playsinline` | `string` | — | Read by video(). |
| `autoplay` | `boolean` | `false` | Read by video(). Bare attribute. |
| `data-autoplay` | `boolean` | `false` | Read by video(). Bare attribute. |
| `muted` | `boolean` | `false` | Read by video(). Bare attribute. |
| `data-muted` | `boolean` | `false` | Read by video(). Bare attribute. |
| `loop` | `boolean` | `false` | Read by video(). Bare attribute. |
| `data-loop` | `boolean` | `false` | Read by video(). Bare attribute. |

## Live example

See `x-video` on the [Behaviors showcase](/?page=behaviors) — search for `x-video` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/video.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
