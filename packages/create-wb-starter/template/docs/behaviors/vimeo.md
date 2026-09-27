# Vimeo

`x-vimeo` embeds the Vimeo video with `video-id` as a responsive player that keeps its aspect ratio. `autoplay` needs `muted`.

## Usage

<div x-demo>
<div x-vimeo video-id="76979871"></div>
</div>

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

<sub>Schema: [`vimeo.schema.json`](../../src/wb-models/vimeo.schema.json)</sub>
