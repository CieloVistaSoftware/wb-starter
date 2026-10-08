# Audio

A bare `<audio>` gets a styled player with a track display, a play button and, when `showEq` is set, a 15-band graphic equaliser with bass and treble controls. Write the native element with `src` and `controls`; the behavior adds the rest around it.

## Usage

<div x-demo>
<audio src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3" controls></audio>
</div>

No attribute needed on `<audio>`. Don't add `x-audio` to it (#746).

`<audio x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | URL | `https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3` | Audio source URL |
| `volume` | `number` | `0.8` | Initial volume (0-1) |
| `loop` | `boolean` | `false` | Loop playback |
| `autoplay` | `boolean` | `false` | Auto-play (requires muted) |
| `muted` | `boolean` | `false` | Start muted |
| `showEq` | `boolean` | `false` | Show 15-band equalizer |
| `showDisplay` | `boolean` | `true` | Show Marantz-style URL/track display with scrolling text |
| `showPlayButton` | `boolean` | `true` | Show a visible custom play/pause button |
| `bass` | `number` | `0` | Bass boost (-12 to 12 dB) |
| `treble` | `number` | `0` | Treble boost (-12 to 12 dB) |

## Events

- `wb:audio:play` — Playback started
- `wb:audio:pause` — Playback paused
- `wb:audio:ended` — Playback ended
- `wb:audio:volumechange` — Volume or mute changed
- `wb:audio:eqchange` — EQ band changed

## Methods

- `play()` — Starts playback
- `pause()` — Pauses playback
- `stop()` — Stops and resets
- `toggle()` — Toggles play/pause
- `setVolume()` — Sets volume
- `getVolume()` — Gets volume
- `setBand()` — Sets EQ band gain
- `applyPreset()` — Applies EQ preset
- `resetEq()` — Resets all EQ bands to 0

<sub>Schema: [`audio.schema.json`](../../src/wb-models/audio.schema.json)</sub>
