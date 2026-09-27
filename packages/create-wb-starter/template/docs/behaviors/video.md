# Video

A plain `<video>` gets native `controls` and inline playback on phones by default; `autoplay` works only together with `muted`, and `poster` sets the image shown before playback.

## Usage

<div x-demo>
<video src="https://www.w3schools.com/html/mov_bbb.mp4" poster="../../images/placeholder.svg" controls></video>
</div>

No attribute needed on `<video>`. Don't add `x-video` to it (#746).

`<video x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `poster` | `string` | `#` | Image shown before playback starts, and after the video ends. Without one the first frame is used, which is often black. |
| `controls` | `string` | — | Show the browser's native play/pause/seek controls. Without them the video can only be driven by script. |
| `playsinline` | `string` | — | Play inline on mobile rather than taking over the screen. iOS goes fullscreen by default without it. |
| `autoplay` | `boolean` | `false` | Begin playing on load. Browsers block autoplay with sound, so this needs `muted` to work unattended. |
| `data-autoplay` | `boolean` | `false` | The `data-` spelling of `autoplay`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `autoplay`. |
| `muted` | `boolean` | `false` | Start with the audio track silenced. Required for `autoplay` to be allowed. |
| `data-muted` | `boolean` | `false` | The `data-` spelling of `muted`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `muted`. |
| `loop` | `boolean` | `false` | Restart from the beginning when playback reaches the end. |
| `data-loop` | `boolean` | `false` | The `data-` spelling of `loop`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `loop`. |

<sub>Schema: [`video.schema.json`](../../src/wb-models/video.schema.json)</sub>
