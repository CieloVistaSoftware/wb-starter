# Video Card

Card with embedded video player

## Type — decorates a semantic element

`x-cardvideo` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardvideo
  src="https://www.w3schools.com/html/mov_bbb.mp4"
  poster="https://picsum.photos/seed/screening/480/270"
  title="Behaviors in 90 seconds"
  description="What replaced the behavior base class, and why."></article>
```

### On a different element

Use `x-cardvideo` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardvideo>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `https://www.w3schools.com/html/mov_bbb.mp4` | Video source URL |
| `poster` | `string` | — | Poster image URL |
| `title` | `string` | — | Video title |
| `description` | `string` | — | Video description |
| `autoplay` | `boolean` | `false` | Auto-play video (requires muted) |
| `muted` | `boolean` | `false` | Mute video |
| `loop` | `boolean` | `false` | Loop video playback |
| `controls` | `boolean` | `true` | Show video controls |
| `aspect` | `16/9` · `4/3` · `1/1` · `21/9` · `9/16` | `16/9` | Video aspect ratio |
| `variant` | `default` · `minimal` · `bordered` · `elevated` | `default` | Visual style variant |

## Events

- `wb:video:play` — Fired when video starts playing
- `wb:video:pause` — Fired when video is paused
- `wb:video:ended` — Fired when video playback ends
- `wb:video:timeupdate` — Fired on time update

## Methods

- `play()` — Plays the video
- `pause()` — Pauses the video
- `stop()` — Stops and resets the video
- `toggle()` — Toggles play/pause
- `mute()` — Mutes the video
- `unmute()` — Unmutes the video
- `setSource()` — Changes the video source
- `getCurrentTime()` — Gets current playback time
- `setCurrentTime()` — Seeks to time
- `getDuration()` — Gets video duration

## Live example

See `x-cardvideo` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardvideo` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardvideo.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
