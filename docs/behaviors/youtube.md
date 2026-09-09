# Youtube

Behavior applied with x-youtube.

## Type — new capability

`x-youtube` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-youtube id="dQw4w9WgXcQ" ratio="16:9"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | — | A full YouTube watch or share URL. The id is extracted from it, so use this OR `video-id`, not both. |
| `video-id` | `string` | — | The 11-character YouTube id — the `v=` value in a watch URL. Use this OR `url`. |
| `controls` | `string` | — | Show YouTube's own player controls. Without them the video can only be driven by script. |
| `autoplay` | `boolean` | `false` | Begin playing on load. Needs `muted`, since browsers block autoplay with sound. |
| `muted` | `boolean` | `false` | Start with audio silenced. Required for `autoplay` to be permitted. |
| `loop` | `boolean` | `false` | Restart from the beginning when playback ends. |

## Live example

See `x-youtube` on the [Behaviors showcase](/?page=behaviors) — search for `x-youtube` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/youtube.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
