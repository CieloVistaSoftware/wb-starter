# Audio

`x-audio` turns a plain host into an audio player with an optional 15-band
equalizer, a scrolling track display, and a custom transport.

Every block below is **live** — it renders and plays on this page, and the code
under it is the exact markup that produced it.

---

## The minimum

One attribute. Everything else has a default.

<div x-demo>
<div x-audio src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

Omit `src` entirely and it falls back to that same royalty-free track, so
`<div x-audio></div>` on its own renders a working player.

---

## Every parameter

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `src` | string | the demo track | Audio source URL |
| `volume` | number | `0.8` | Initial volume, `0`–`1` |
| `loop` | boolean | `false` | Restart on finish |
| `autoplay` | boolean | `false` | Play on load — browsers require `muted` too |
| `show-eq` | boolean | `false` | Show the 15-band equalizer |
| `show-display` | boolean | `true` | Scrolling track/URL display |
| `show-play-button` | boolean | `true` | Custom play/pause button |
| `muted` | boolean | `false` | **Declared but not implemented** — see below |
| `bass` | number | `0` | **Declared but not implemented** — see below |
| `treble` | number | `0` | **Declared but not implemented** — see below |

Attributes are kebab-case in markup (`show-eq`), camelCase in the schema
(`showEq`).

---

### `show-eq` — the 15-band equalizer

<div x-demo>
<div x-audio show-eq
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

The EQ uses the Web Audio API, which reads the raw samples. That means a
**cross-origin track must send CORS headers** — see the note at the bottom.
Without them the player still renders and the transport still works, but you get
silence.

### `volume` — initial level

<div x-demo>
<div x-audio volume="0.3"
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

### `loop` — repeat on finish

<div x-demo>
<div x-audio loop
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

### `show-display="false"` — hide the track display

<div x-demo>
<div x-audio show-display="false"
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

### `show-play-button="false"` — no custom transport

<div x-demo>
<div x-audio show-play-button="false"
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

### `autoplay` + `muted`

<div x-demo>
<div x-audio autoplay muted
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

Every current browser blocks autoplay with sound. `muted` is the documented
companion — but see the next section: it is not wired up, so this demo will be
blocked rather than starting silently.

### Everything at once

<div x-demo>
<div x-audio
     show-eq
     show-display
     show-play-button
     volume="0.6"
     loop
     src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></div>
</div>

---

## Three parameters that do nothing

`muted`, `bass` and `treble` are declared in `src/wb-models/audio.schema.json`,
appear in the table above because the schema is the source of truth for it, and
are **not implemented**. They are listed rather than quietly dropped, because a
missing row reads as "not supported" while a silent no-op reads as "broken".

Verified two ways:

- `grep -n 'muted\|bass\|treble' src/wb-viewmodels/semantics/audio.js` returns
  nothing — the behavior never reads them.
- Rendered live, `<div x-audio muted bass="10" treble="-6">` produces markup
  **byte-identical** to `<div x-audio>`, and the inner `<audio>` element's
  `muted` property stays `false`.

Nothing throws. An unknown attribute on a `<div>` is legal HTML, so the only
symptom is that the control has no effect.

This is one instance of the wider gap tracked in **#861**: 154 declared
attributes across 47 behaviors that are documented and shown in the showcase
while doing nothing. When `muted` is implemented, `autoplay muted` above starts
working and this section should shrink.

---

## The equalizer and CORS

With `show-eq`, playback runs through the Web Audio API, which needs to read the
audio data itself rather than just stream it. A cross-origin file therefore has
to send `Access-Control-Allow-Origin`.

- **Without `show-eq`** — any reachable URL works.
- **With `show-eq`** — the file's server must send CORS headers, or the graph
  gets silence.

If you hear nothing with the EQ on and everything with it off, that is the
cause, not the player.

---

## Source

- Behavior — `src/wb-viewmodels/semantics/audio.js`
- Schema — `src/wb-models/audio.schema.json`
- Styles — `src/styles/behaviors/audio.css`

`src/wb-viewmodels/x-audio.js` is a thin wrapper kept from the behavior era;
the registry maps `audio` to `semantics/audio`, which is what actually runs.
