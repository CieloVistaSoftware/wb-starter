# Video Card

`x-cardvideo` renders a card with a video player from `src` (with `poster` shown before playback) above a title and description. Use it where the video needs a heading and context; for a bare player use `<video>`.

## Usage

<div x-demo>
<article x-cardvideo
  src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Staircase_Falls_timelapse_Yosemite_CA_2023-07-13_07-23-07_1.webm"
  poster="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Reflections_in_Lake_Alpine%2C_Alpine_County.jpg/1280px-Reflections_in_Lake_Alpine%2C_Alpine_County.jpg"
  title="Behaviors in 90 seconds"
  description="What replaced the behavior base class, and why."></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | URL | `https://upload.wikimedia.org/wikipedia/commons/f/f9/Staircase_Falls_timelapse_Yosemite_CA_2023-07-13_07-23-07_1.webm` | Video source URL |
| `poster` | URL | `#` | Poster image URL |
| `title` | text | — | Video title |
| `description` | text | — | Video description |
| `autoplay` | `boolean` | `false` | Auto-play video (requires muted) |
| `muted` | `boolean` | `false` | Mute video |
| `loop` | `boolean` | `false` | Loop video playback |
| `controls` | `boolean` | `true` | Show video controls |
| `aspect` | `16/9` · `4/3` · `1/1` · `21/9` · `9/16` | `16/9` | Video aspect ratio |
| `variant` | `default` · `minimal` · `bordered` · `elevated` | `default` | Visual style variant |

## Events

- `wb:cardvideo:play` — Fired when the video starts playing
- `wb:cardvideo:pause` — Fired when the video is paused
- `wb:cardvideo:ended` — Fired when video playback ends

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
