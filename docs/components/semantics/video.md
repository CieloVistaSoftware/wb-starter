# Video - WB Framework v3.0

Enhanced HTML5 video player with configurable defaults.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-video>` |
| Behavior | `video` |
| Semantic | `<video>` |
| Base Class | `wb-video` |
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

## Usage

### Custom Element

```html
<wb-video src="movie.mp4"></wb-video>
```

### Native Video (Enhanced)

```html
<video data-wb="video" src="clip.mp4" controls></video>
```

### With Poster

```html
<wb-video src="movie.mp4" poster="thumbnail.jpg"></wb-video>
```

### Background Video

```html
<wb-video 
  src="background.mp4" 
  autoplay 
  muted 
  loop 
  controls="false">
</wb-video>
```

## Generated Structure

```html
<div class="wb-video">
  <video 
    class="wb-video__player"
    src="movie.mp4"
    poster="thumb.jpg"
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
const video = document.querySelector('wb-video');

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
| `.wb-video` | Always | Base styling |
| `.wb-video--playing` | Playing | Playback active |
| `.wb-video--fullscreen` | Fullscreen | Fullscreen mode |

## Accessibility

The native video element provides built-in accessibility:
- Keyboard controls for play/pause
- Screen reader announcements
- Captions support via `<track>` elements

```html
<wb-video src="movie.mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
</wb-video>
```
