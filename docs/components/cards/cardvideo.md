# Card Video Component

## Overview
The `cardvideo` component extends the base card to display a video player. It supports standard video attributes and includes built-in accessibility checks for captions.

## Internals & Lifecycle

### Initialization
1.  **Configuration Parsing**: Reads attributes like `data-src`, `data-poster`, `data-autoplay`, etc.
2.  **Structure Building**: Calls `base.buildStructure()` to set up the standard header/main/footer layout.
3.  **Video Injection**: Creates a `<figure>` containing a `<video>` element and inserts it **before** the first child of the card (typically above the header).

### Accessibility Logic
The component performs a runtime check for accessibility:
- It looks for existing `<track>` elements inside the container.
- If no tracks are found and `config.tracks` is not provided:
    - Sets `data-captions-missing="true"` on the host element.
    - Injects a hidden warning div (`.wb-card__video-warning`) for screen readers and test suites.

### DOM Structure

<article class="wb-card wb-card--video">
  <!-- Injected Video Container -->
  <figure class="wb-card__figure">
    <video src="..." controls playsinline ...></video>
    <!-- Optional Warning -->
    <div class="wb-card__video-warning" style="display:none;">Video missing captions</div>
  </figure>

  <!-- Standard Card Structure -->
  <header class="wb-card__header">...</header>
  <main class="wb-card__main">...</main>
  <footer class="wb-card__footer">...</footer>
</article>

```html
<article class="wb-card wb-card--video">
  <!-- Injected Video Container -->
  <figure class="wb-card__figure">
    <video src="..." controls playsinline ...></video>
    <!-- Optional Warning -->
    <div class="wb-card__video-warning" style="display:none;">Video missing captions</div>
  </figure>

  <!-- Standard Card Structure -->
  <header class="wb-card__header">...</header>
  <main class="wb-card__main">...</main>
  <footer class="wb-card__footer">...</footer>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-src` | string | required | URL of the video file. |
| `data-poster` | string | - | URL of the poster image shown before playback. |
| `data-autoplay` | boolean | `false` | Automatically start playback (usually requires `muted`). |
| `data-muted` | boolean | `false` | Mutes the audio by default. |
| `data-loop` | boolean | `false` | Loops the video indefinitely. |
| `data-controls` | boolean | `true` | Shows native video controls. Set to `false` to hide. |

## Usage Example

<div data-wb="cardvideo" 
     data-src="/assets/video.mp4" 
     data-poster="/assets/poster.jpg"
     data-title="Feature Demo"
     data-content="Watch our latest features in action.">
  <!-- Optional: Add tracks for accessibility -->
  <track kind="captions" src="/assets/captions.vtt" srclang="en" label="English">
</div>

```html
<div data-wb="cardvideo" 
     data-src="/assets/video.mp4" 
     data-poster="/assets/poster.jpg"
     data-title="Feature Demo"
     data-content="Watch our latest features in action.">
  <!-- Optional: Add tracks for accessibility -->
  <track kind="captions" src="/assets/captions.vtt" srclang="en" label="English">
</div>
```
