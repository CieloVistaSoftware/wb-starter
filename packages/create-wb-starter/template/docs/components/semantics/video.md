# Video - wb-starter v3.0

Enhanced HTML5 video player with configurable defaults.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<video>` |
| Behavior | `video` |
| Semantic | `<video>` |
| Root CSS Class | `x-video` |
| Category | Media |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | Required | Video source URL |
| `poster` | string | `""` | Poster image URL |
| `controls` | boolean | `true` | Show native controls |
| `autoplay` | boolean | `false` | Auto-play video |
| `muted` | boolean | `false` | Start muted |
| `loop` | boolean | `false` | Loop playback |
| `playsInline` | boolean | `true` | Play inline on mobile |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"></video>
</div>

## Usage

### Custom Element

```html
<video src="movie.mp4"></video>
```

### Native Video (Enhanced)

```html
<video
  src="clip.mp4"
  controls>
</video>
```

### With Poster

```html
<video
  src="movie.mp4"
  poster="https://picsum.photos/seed/thumbnail/800/450">
</video>
```

### Background Video

```html
<video
  src="background.mp4"
  autoplay
  muted
  loop
  controls="false">
</video>
```

## Generated Structure

```html
<div class="x-video">
  <video
    class="x-video__player"
    src="movie.mp4"
    poster="https://picsum.photos/seed/thumb/800/450"
    controls
    playsinline>
  </video>
</div>
```

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `play()` | Starts playback | `Promise` |
| `pause()` | Pauses playback | - |
| `toggle()` | Toggles play/pause | - |
| `setTime(t)` | Seeks to time (seconds) | - |
| `getTime()` | Gets current time | `number` |
| `setVolume(v)` | Sets volume (0-1) | - |
| `mute()` | Mutes audio | - |
| `unmute()` | Unmutes audio | - |

```javascript
const video = document.querySelector('x-video');

// Playback
video.play();
video.pause();
video.toggle();

// Seeking
video.setTime(30);  // Skip to 30 seconds
const currentTime = video.getTime();

// Volume
video.setVolume(0.5);
video.mute();
```

## Events

| Event | Description |
|-------|-------------|
| `play` | Playback started |
| `pause` | Playback paused |
| `ended` | Playback ended |
| `timeupdate` | Current time changed |
| `volumechange` | Volume changed |

```javascript
video.addEventListener('ended', () => {
  console.log('Video finished');
});
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-video` | Always | Base styling |
| `.x-video--playing` | Playing | Playback active |
| `.x-video--fullscreen` | Fullscreen | Fullscreen mode |

## Accessibility

The native video element provides built-in accessibility:
- Keyboard controls for play/pause
- Screen reader announcements
- Captions support via `<track>` elements

```html
<video src="movie.mp4">
  <track
    kind="captions"
    src="captions.vtt"
    srclang="en"
    label="English">
</video>
```
