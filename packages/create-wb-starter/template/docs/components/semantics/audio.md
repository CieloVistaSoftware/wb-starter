# Audio - wb-starter v3.0

Audio player with optional 15-band graphic equalizer.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<audio>` |
| Behavior | `audio` |
| Semantic | `<div>` |
| Root CSS Class | `x-audio` |
| Category | Media |
| Schema | `src/wb-models/audio.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | Required | Audio source URL -- no playback without one |
| `volume` | number | `0.8` | Initial volume (0-1) |
| `loop` | boolean | `false` | Loop playback |
| `autoplay` | boolean | `false` | Auto-play (requires muted) |
| `muted` | boolean | `false` | Start muted |
| `show-eq` | boolean | `false` | Show 15-band equalizer |
| `bass` | number | `0` | Bass boost (-12 to 12 dB) |
| `treble` | number | `0` | Treble boost (-12 to 12 dB) |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
</div>

## Usage

### Custom Element

```html
<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
```

### Native Audio (Enhanced)

```html
<!-- x-audio is auto-injected onto native <audio> tags when autoInject is
     on -- no attribute needed. -->
<audio
  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  controls>
</audio>
```

### With Equalizer

```html
<audio
  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  show-eq>
</audio>
```

### Background Audio

```html
<audio
  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  autoplay
  muted
  loop>
</audio>
```

### With Bass/Treble Boost

```html
<audio
  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  bass="6"
  treble="3">
</audio>
```

## Generated Structure

```html
<div class="x-audio">
  <audio
    class="x-audio__player"
    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    controls>
  </audio>
  <!-- EQ Panel (when show-eq is present) -->
  <div class="x-audio__eq">
    <div class="x-audio__eq-sliders">
      <!-- 15 band sliders -->
    </div>
    <div class="x-audio__presets">
      <button>Flat</button>
      <button>Bass</button>
      <button>Treble</button>
    </div>
    <input
      class="x-audio__master"
      type="range">
  </div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-audio` | Always | Base styling |
| `.x-audio--eq-visible` | `show-eq` | EQ panel visible |
| `.x-audio--playing` | Playing | Playback active |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `play()` | Starts playback | `Promise` |
| `pause()` | Pauses playback | - |
| `stop()` | Stops and resets | - |
| `toggle()` | Toggles play/pause | - |
| `setVolume(vol)` | Sets volume (0-1) | - |
| `getVolume()` | Gets volume | `number` |
| `setBand(band, gain)` | Sets EQ band gain | - |
| `applyPreset(name)` | Applies EQ preset | - |
| `resetEq()` | Resets all EQ bands | - |

```javascript
const audio = document.querySelector('x-audio');

// Playback control
audio.play();
audio.pause();
audio.toggle();

// Volume
audio.setVolume(0.5);

// Equalizer
audio.setBand(3, 6);  // Boost band 3 by 6dB
audio.applyPreset('bass');
audio.resetEq();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:audio:play` | Playback started | - |
| `wb:audio:pause` | Playback paused | - |
| `wb:audio:ended` | Playback ended | - |
| `wb:audio:volumechange` | Volume changed | `{ volume: number }` |
| `wb:audio:eqchange` | EQ band changed | `{ band: number, gain: number }` |

```javascript
audio.addEventListener('wb:audio:play', () => {
  console.log('Started playing');
});

audio.addEventListener('wb:audio:eqchange', (e) => {
  console.log(`Band ${e.detail.band}: ${e.detail.gain}dB`);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-audio-bg` | `linear-gradient(135deg, #1a1a2e, #16213e)` | Player background |
| `--x-audio-radius` | `16px` | Border radius |
| `--x-audio-padding` | `1rem` | Padding |
| `--x-audio-eq-slider-width` | `24px` | EQ slider width |
| `--x-audio-eq-slider-height` | `120px` | EQ slider height |
| `--x-audio-eq-slider-bg` | `#333` | Slider track background |
| `--x-audio-eq-slider-fill` | `#6366f1` | Slider fill color |

## EQ Presets

Built-in equalizer presets:
- **Flat** - All bands at 0dB
- **Bass Boost** - Enhanced low frequencies
- **Treble** - Enhanced high frequencies
- **V-Shape** - Boosted bass and treble, cut mids
- **Vocal** - Enhanced vocal frequencies

## Schema

Location: `src/wb-models/audio.schema.json`
