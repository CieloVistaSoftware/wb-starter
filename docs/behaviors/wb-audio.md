# wb-audio

A premium custom audio player with a 15-band graphic equalizer, Web Audio API support, and advanced controls. Requires a `src` -- there is no default track (a src-less `<wb-audio>` throws, #433).

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></wb-audio>
</wb-demo>

---

## Usage

```html
<!-- Basic usage -- src is required, there is no default track -->
<wb-audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></wb-audio>
<!-- With a different audio source -->
<wb-audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></wb-audio>
<!-- With equalizer and custom volume -->
<wb-audio
  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  show-eq
  volume="0.8">
</wb-audio>
<!-- With controls, looping, and podcast -->
<wb-audio
  src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"
  controls
  loop>
</wb-audio>
```

---

## Attributes / Parameters

| Attribute   | Type    | Default   | Description |
|-------------|---------|-----------|-------------|
| `src`       | string  | (demo)    | Audio file URL. If omitted, uses a pleasant royalty-free demo track. |
| `controls`  | boolean | true      | Show native audio controls. Set to `false` to hide. |
| `autoplay`  | boolean | false     | Start playback automatically. |
| `loop`      | boolean | false     | Loop playback. |
| `muted`     | boolean | false     | Start muted. |
| `show-eq`   | boolean | false     | Show 15-band graphic equalizer UI. |
| `volume`    | number  | 0.8       | Initial volume (0.0–1.0). |
| `bass`      | number  | 0         | Initial bass adjustment. |
| `treble`    | number  | 0         | Initial treble adjustment. |

---

## Features
- 15-band ISO standard graphic equalizer (show with `show-eq`)
- Web Audio API for advanced audio processing
- Royalty-free demo track: "Carefree" by Kevin MacLeod (used if no `src`)
- All standard audio attributes supported
- Dark mode UI by default
- Accessible and keyboard-friendly

---

## API Methods

- `setSrc(src: string)`: Change the audio source dynamically
- `getSrc(): string`: Get the current audio source
- `isUsingDefault(): boolean`: Returns true if using the built-in demo audio

---

## Schema & Tests
- [Schema](../../src/wb-models/wb-audio.schema.json) (if present)
- [Tests](../../tests/behaviors/behaviors-showcase.spec.ts) (integration)

---

## Source
- [wb-audio.js](../../src/wb-viewmodels/wb-audio.js)
- [audio.js (behavior)](../../src/wb-viewmodels/semantics/audio.js)

---

## Example: Full Feature
```html
<wb-audio
  src="song.mp3"
  show-eq
  controls
  autoplay
  loop
  volume="1"
  bass="2"
  treble="-1">
</wb-audio>
```
