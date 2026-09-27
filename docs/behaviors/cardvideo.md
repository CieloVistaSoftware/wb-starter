# Video Card

`x-cardvideo` renders a card with a video player from `src` (with `poster` shown before playback) above a title and description. Use it where the video needs a heading and context; for a bare player use `<video>`.

## Usage

<div x-demo>
<article x-cardvideo
  src="https://www.w3schools.com/html/mov_bbb.mp4"
  poster="/images/placeholder.svg"
  title="Behaviors in 90 seconds"
  description="What replaced the behavior base class, and why."></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `https://www.w3schools.com/html/mov_bbb.mp4` | Video source URL |
| `poster` | `string` | `#` | Poster image URL |
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

<sub>Schema: [`cardvideo.schema.json`](../../src/wb-models/cardvideo.schema.json)</sub>
