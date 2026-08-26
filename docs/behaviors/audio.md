# Audio

Audio player with optional 15-band graphic equalizer

## Type — new capability

`x-audio` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<audio src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3" controls></audio>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3` | Audio source URL |
| `volume` | `number` | `0.8` | Initial volume (0-1) |
| `loop` | `boolean` | `false` | Loop playback |
| `autoplay` | `boolean` | `false` | Auto-play (requires muted) |
| `muted` | `boolean` | `false` | Start muted |
| `show-eq` | `boolean` | `false` | Show 15-band equalizer |
| `show-display` | `boolean` | `true` | Show Marantz-style URL/track display with scrolling text |
| `show-play-button` | `boolean` | `true` | Show a visible custom play/pause button |
| `bass` | `number` | `0` | Bass boost (-12 to 12 dB) |
| `treble` | `number` | `0` | Treble boost (-12 to 12 dB) |

## Events

- `wb:audio:play` — Playback started
- `wb:audio:pause` — Playback paused
- `wb:audio:ended` — Playback ended
- `wb:audio:volumechange` — Volume changed
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

## Live example

See `x-audio` on the [Behaviors showcase](/?page=behaviors) — search for `x-audio` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/audio.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
