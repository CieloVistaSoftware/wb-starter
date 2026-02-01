# Audio - wb-starter v3.0

Audio player with optional 15-band graphic equalizer.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-audio>` |
| Behavior | `audio` |
| Semantic | `<div>` |
| Base Class | `wb-audio` |
| Category | Media |
| Schema | `src/wb-models/audio.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | Required | Audio source URL |
| `volume` | number | `0.8` | Initial volume (0-1) |
| `loop` | boolean | `false` | Loop playback |
| `autoplay` | boolean | `false` | Auto-play (requires muted) |
| `muted` | boolean | `false` | Start muted |
| `showEq` | boolean | `false` | Show 15-band equalizer |
| `bass` | number | `0` | Bass boost (-12 to 12 dB) |
| `treble` | number | `0` | Treble boost (-12 to 12 dB) |

## Usage

### Custom Element

```html
<wb-audio src="music.mp3"></wb-audio>
```

### Native Audio (Enhanced)

```html
<audio data-wb="audio" src="music.mp3" controls></audio>
```

### With Equalizer

```html
<wb-audio src="music.mp3" showEq></wb-audio>
```

### Background Audio

```html
<wb-audio src="ambient.mp3" autoplay muted loop></wb-audio>
```

### With Bass/Treble Boost

```html
<wb-audio src="track.mp3" bass="6" treble="3"></wb-audio>
```

## Generated Structure

```html
<div class="wb-audio">
  <audio class="wb-audio__player" src="music.mp3" controls></audio>
  
  <!-- EQ Panel (when showEq is true) -->
  <div class="wb-audio__eq">
    <div class="wb-audio__eq-sliders">
      <!-- 15 band sliders -->
    </div>
    <div class="wb-audio__presets">
      <button>Flat</button>
      <button>Bass</button>
      <button>Treble</button>
    </div>
    <input class="wb-audio__master" type="range">
  </div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-audio` | Always | Base styling |
| `.wb-audio--eq-visible` | `showEq` | EQ panel visible |
| `.wb-audio--playing` | Playing | Playback active |

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
const audio = document.querySelector('wb-audio');

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
| `--wb-audio-bg` | `linear-gradient(135deg, #1a1a2e, #16213e)` | Player background |
| `--wb-audio-radius` | `16px` | Border radius |
| `--wb-audio-padding` | `1rem` | Padding |
| `--wb-audio-eq-slider-width` | `24px` | EQ slider width |
| `--wb-audio-eq-slider-height` | `120px` | EQ slider height |
| `--wb-audio-eq-slider-bg` | `#333` | Slider track background |
| `--wb-audio-eq-slider-fill` | `#6366f1` | Slider fill color |

## EQ Presets

Built-in equalizer presets:
- **Flat** - All bands at 0dB
- **Bass Boost** - Enhanced low frequencies
- **Treble** - Enhanced high frequencies
- **V-Shape** - Boosted bass and treble, cut mids
- **Vocal** - Enhanced vocal frequencies

## Schema

Location: `src/wb-models/audio.schema.json`
