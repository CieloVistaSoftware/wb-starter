# Youtube

`x-youtube` embeds a YouTube video from `video-id` or a full `url` as a responsive player that keeps its aspect ratio. `autoplay` needs `muted`.

## Usage

<div x-demo>
<div x-youtube id="dQw4w9WgXcQ" ratio="16:9"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | `#` | A full YouTube watch or share URL. The id is extracted from it, so use this OR `video-id`, not both. |
| `video-id` | `string` | — | The 11-character YouTube id — the `v=` value in a watch URL. Use this OR `url`. |
| `controls` | `string` | — | Show YouTube's own player controls. Without them the video can only be driven by script. |
| `autoplay` | `boolean` | `false` | Begin playing on load. Needs `muted`, since browsers block autoplay with sound. |
| `muted` | `boolean` | `false` | Start with audio silenced. Required for `autoplay` to be permitted. |
| `loop` | `boolean` | `false` | Restart from the beginning when playback ends. |

<sub>Schema: [`youtube.schema.json`](../../src/wb-models/youtube.schema.json)</sub>
