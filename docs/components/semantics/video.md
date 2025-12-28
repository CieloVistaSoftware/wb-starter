# Video Component Design & User Guide

## 1. Design Philosophy

The `video` component wraps the HTML5 `<video>` element to provide a consistent API and default configuration. It simplifies common tasks like setting up background videos (autoplay + muted + loop) or handling poster images.

### Key Features
- **Configurable Defaults**: Easy setup via data attributes.
- **API Wrapper**: Simplified methods for playback control.
- **PlaysInline**: Ensures videos play inline on mobile devices by default.

## 2. User Guide

### Basic Usage
Add `data-wb="video"` to a `<video>` element.

```html
<video data-wb="video" src="movie.mp4"></video>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-controls` | Boolean | `true` | Show native controls. |
| `data-autoplay` | Boolean | `false` | Autoplay video. |
| `data-muted` | Boolean | `false` | Mute audio. |
| `data-loop` | Boolean | `false` | Loop playback. |
| `data-poster` | String | `''` | URL of poster image. |

### API Methods
Access via `element.wbVideo`:
- `play()`, `pause()`, `toggle()`
- `setTime(t)`, `getTime()`
- `setVolume(v)`, `mute()`, `unmute()`

## 3. Examples

### Example 1: Background Video
A silent, looping background video.

```html
<video 
  data-wb="video" 
  src="bg.mp4" 
  data-autoplay="true" 
  data-muted="true" 
  data-loop="true" 
  data-controls="false">
</video>
```

### Example 2: Standard Player
A video player with a poster image.

```html
<video 
  data-wb="video" 
  src="clip.mp4" 
  data-poster="thumb.jpg">
</video>
```

## 4. Why It Works
The component maps the data attributes directly to the DOM properties (`autoplay`, `loop`, `muted`, etc.) during initialization. This ensures that the video behaves as expected even if the attributes were added dynamically after the page load.
