# Video

Behavior applied with x-video.

## Type — new capability

`x-video` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<video src="https://www.w3schools.com/html/mov_bbb.mp4" poster="/images/placeholder.svg" controls></video>
```



### Declining it

A `<video>` **is** the video behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<video x-ignore>
  <!-- a plain video: no behavior is injected -->
</video>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `poster` | `string` | — | Image shown before playback starts, and after the video ends. Without one the first frame is used, which is often black. |
| `controls` | `string` | — | Show the browser's native play/pause/seek controls. Without them the video can only be driven by script. |
| `playsinline` | `string` | — | Play inline on mobile rather than taking over the screen. iOS goes fullscreen by default without it. |
| `autoplay` | `boolean` | `false` | Begin playing on load. Browsers block autoplay with sound, so this needs `muted` to work unattended. |
| `data-autoplay` | `boolean` | `false` | The `data-` spelling of `autoplay`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `autoplay`. |
| `muted` | `boolean` | `false` | Start with the audio track silenced. Required for `autoplay` to be allowed. |
| `data-muted` | `boolean` | `false` | The `data-` spelling of `muted`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `muted`. |
| `loop` | `boolean` | `false` | Restart from the beginning when playback reaches the end. |
| `data-loop` | `boolean` | `false` | The `data-` spelling of `loop`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `loop`. |

## Live example

See `x-video` on the [Behaviors showcase](/?page=behaviors) — search for `x-video` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/video.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
