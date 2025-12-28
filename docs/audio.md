# Audio Component

## Overview
The Audio component provides advanced audio playback and a 15-band graphic equalizer UI for user-controlled sound shaping. It is designed for integration into the builder and supports both basic and advanced audio features.

## Features
- Audio playback (HTML5 audio)
- 15-band graphic equalizer (Web Audio API)
- Preset and zero-all buttons
- Volume control
- Responsive, accessible UI

## UI Structure
- Header row: Icon and title
- Button row: Preset and zero-all buttons
- EQ panel: 15 vertical sliders (bands)
- Volume control at the bottom

## Usage
```
<audio controls src="path/to/audio.mp3"></audio>
<!-- The builder enhances this with the EQ UI -->
```

## Schema Reference
See `audio.schema.json` for the data structure and configuration options.

## Customization
- Add or remove EQ bands by editing the `EQ_BANDS` array in `media.js`.
- Presets can be customized in the same file.

## Accessibility
- All controls are keyboard accessible.
- Sliders and buttons have ARIA labels.

## Example
```
{
  "type": "audio",
  "src": "song.mp3",
  "eq": true,
  "volume": 0.8
}
```

## Troubleshooting & CORS
When using the Equalizer (`showEq` or `eq: true`), the audio is processed using the Web Audio API. This requires the audio file to be served with Cross-Origin Resource Sharing (CORS) headers if it is hosted on a different domain.

- **Standard Player**: Works with any audio URL.
- **Equalizer Player**: Requires `Access-Control-Allow-Origin: *` (or your domain) on the audio file server.

If the server does not provide these headers, the browser will block the Web Audio API from accessing the audio data, resulting in **silence**.

**Solution:**
1. Ensure your audio hosting provider supports CORS.
2. Use a service like GitHub Pages, AWS S3 (configured for CORS), or a dedicated CDN.
3. If testing locally, ensure your local server sends CORS headers.

---
