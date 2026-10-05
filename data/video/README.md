# Videos

One command turns a narration MP3 into a finished video of the real site:

```powershell
npm run make-video                          # wb-starter-intro (16:9, about 3.5 minutes)
npm run make-video -- wb-starter-short      # the 60-second Short (9:16)
```

## Steps

1. Print the narration and paste it into ElevenLabs (voice: Roger):
   `npm run make-video -- wb-starter-intro --script`
2. Download the MP3 to `data/video/audio/wb-starter-intro.mp3`
   (or pass `--audio path\to\file.mp3`).
3. Run `npm run make-video -- wb-starter-intro`.
   The video lands in `data/video/out/wb-starter-intro.mp4`, with captions burned in
   and a matching `.srt` beside it.

Without an MP3 it renders `<name>-preview.mp4`: silent, timed at 150 words a minute,
for checking the visuals before generating the voice.

Needs ffmpeg once: `winget install Gyan.FFmpeg`, then open a new terminal.

## How it works

Each `<name>.json` here lists the scenes. Every scene has the `narration` spoken over
it and what to `show`:

| `show.type` | What is recorded |
|---|---|
| `card` | A title card: `title`, optional `subtitle`, `items` and `code` |
| `page` | A page of the site (`path`, e.g. `?page=behaviors`), with `scroll: true` to glide down it |
| `demo` | `html` rendered by WB on the test harness, then `actions` (`click`, `drag` with `by: [dx, dy]`); `showHtml` lists the element's tag as the inspector shows it |

`scripts/make-video.mjs` starts the site, records each scene in Chromium for its
share of the narration (by word count, with scene changes moved to the nearest pause
in the audio), joins the clips, burns in the captions and adds the audio. A scene's
`caption` replaces its narration in the captions, for words said differently from how
they are written, like a URL.

`data/video/audio/` and `data/video/out/` are not committed.
