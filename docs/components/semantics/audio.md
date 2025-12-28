# Audio Component Design & User Guide

## 1. Design Philosophy

The `audio` component transforms the standard HTML5 `<audio>` element into a premium, studio-quality audio player. It leverages the **Web Audio API** to provide a 15-band graphic equalizer, allowing users to fine-tune the audio experience. The design mimics a dark-mode studio interface with realistic sliders and visual feedback.

### Key Features
- **15-Band Graphic EQ**: ISO standard frequencies (25Hz to 16kHz).
- **Presets**: Built-in EQ presets (Flat, Bass Boost, Treble, V-Shape, Vocal).
- **Visual Feedback**: Real-time DB display and color-coded sliders.
- **Master Volume**: Independent master volume control.
- **Progressive Enhancement**: Works as a standard audio player if Web Audio API is unavailable.

## 2. User Guide

### Basic Usage
Add `data-wb="audio"` to an existing `<audio>` element or a `<div>` with a `data-src` attribute.

```html
<!-- Using an existing audio element -->
<audio data-wb="audio" src="music.mp3" controls></audio>

<!-- Using a div wrapper -->
<div data-wb="audio" data-src="music.mp3" data-controls="true"></div>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-src` | String | `''` | URL of the audio file. |
| `data-controls` | Boolean | `true` | Show native audio controls. |
| `data-autoplay` | Boolean | `false` | Autoplay the audio. |
| `data-loop` | Boolean | `false` | Loop the audio. |
| `data-volume` | Number | `0.8` | Initial volume (0.0 to 1.0). |
| `data-show-eq` | Boolean | `false` | Show the graphic equalizer UI. |

### API Methods
Access the component instance via `element.wbAudio`:
- `play()`: Start playback.
- `pause()`: Pause playback.
- `toggle()`: Toggle play/pause.
- `setVolume(0-1)`: Set master volume.
- `setBand(index, gain)`: Set gain for a specific EQ band.

## 3. Examples

### Example 1: Basic Player
A simple audio player with custom styling.

```html
<audio data-wb="audio" src="/assets/audio/demo.mp3" controls></audio>
```

### Example 2: Studio Player with EQ
A full-featured player with the 15-band equalizer enabled.

```html
<div 
  data-wb="audio" 
  data-src="/assets/audio/studio-mix.mp3" 
  data-show-eq="true"
  data-volume="0.5">
</div>
```

## 4. Why It Works
The component creates an `AudioContext` and routes the audio source through a series of `BiquadFilterNode`s (peaking filters) before reaching the destination. This allows for precise manipulation of specific frequency bands without affecting the rest of the audio spectrum. The UI is generated dynamically and synced with the underlying audio nodes.
