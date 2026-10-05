/**
 * video-timeline.mjs -- the pure half of scripts/make-video.mjs.
 *
 * John, 2026-10-05: "I just want to click something to make the video with
 * audio." A video is described once, in data/video/<name>.json: an ordered list
 * of scenes, each with the narration spoken over it and what to show. These
 * functions turn that description plus the length of the recorded narration
 * into a timeline (when each scene starts and ends) and burned-in captions.
 *
 * Nothing here touches the disk, a browser or ffmpeg, so every rule is
 * testable on its own (tests/regression/video-timeline.spec.ts).
 */

/** ElevenLabs audio tags ("[laughs]", "[pause]") are direction, not words. */
export function stripAudioTags(text) {
  return String(text || '').replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function wordCount(text) {
  const plain = stripAudioTags(text);
  return plain ? plain.split(' ').length : 0;
}

/** The text to paste into ElevenLabs: every scene's narration, one paragraph each. */
export function narrationScript(video) {
  return video.scenes.map((s) => String(s.narration || '').trim()).filter(Boolean).join('\n\n');
}

/** Seconds the narration should take at a speaking rate, for a preview with no audio yet. */
export function estimateSeconds(video, wordsPerMinute = 150) {
  const words = video.scenes.reduce((n, s) => n + wordCount(s.narration), 0);
  return Math.max(1, (words / wordsPerMinute) * 60);
}

/**
 * Split totalSeconds across the scenes in proportion to how many words each
 * one speaks, so a long paragraph gets a long scene. A scene with no narration
 * gets `minSeconds`.
 *
 * Then, when the audio's silences are known, each boundary moves to the
 * nearest pause within `snapWindow` seconds: a scene should change between
 * sentences, not in the middle of one. Word counts only approximate the
 * narrator's pace; the pauses are where the narrator actually stopped.
 *
 * @param {{scenes: {narration?: string}[]}} video
 * @param {number} totalSeconds - length of the narration audio
 * @param {{silences?: number[], snapWindow?: number, minSeconds?: number}} [opts]
 *        silences: midpoints (seconds) of the pauses in the audio
 * @returns {{start: number, end: number}[]} one entry per scene
 */
export function planTimeline(video, totalSeconds, opts = {}) {
  const { silences = [], snapWindow = 1.5, minSeconds = 1.5 } = opts;
  const weights = video.scenes.map((s) => Math.max(wordCount(s.narration), 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Proportional boundaries between scenes (not the 0 and the end).
  const boundaries = [];
  let acc = 0;
  for (let i = 0; i < weights.length - 1; i++) {
    acc += weights[i];
    boundaries.push((acc / totalWeight) * totalSeconds);
  }

  // Snap each boundary to the nearest pause, keeping the order and a minimum
  // length for every scene.
  const snapped = [];
  for (let i = 0; i < boundaries.length; i++) {
    const prev = i === 0 ? 0 : snapped[i - 1];
    const lo = prev + minSeconds;
    const hi = totalSeconds - minSeconds * (boundaries.length - i);
    let best = boundaries[i];
    let bestDist = Infinity;
    for (const t of silences) {
      const d = Math.abs(t - boundaries[i]);
      if (d <= snapWindow && d < bestDist && t >= lo && t <= hi) { best = t; bestDist = d; }
    }
    snapped.push(Math.min(Math.max(best, lo), Math.max(lo, hi)));
  }

  const edges = [0, ...snapped, totalSeconds];
  return video.scenes.map((_, i) => ({ start: edges[i], end: edges[i + 1] }));
}

/** 75.5 -> "00:01:15,500" */
export function srtTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

/** Break a caption into lines of at most `width` characters, on word boundaries. */
export function wrapCaption(text, width = 42) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > width) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

/**
 * Captions for the whole video, in SRT. Each scene's narration (or its
 * `caption` override, for words written differently from how they are said,
 * like a URL) is split into sentences; each sentence is shown for its share of
 * the scene, by word count. A sentence longer than two lines is split again.
 */
export function buildSrt(video, timeline, { width = 42 } = {}) {
  const cues = [];
  video.scenes.forEach((scene, i) => {
    const text = stripAudioTags(scene.caption || scene.narration);
    if (!text) return;
    // A dash left at the start of a caption ("— so the docs…") reads as a stray mark.
    const sentences = text.match(/[^.!?…]+[.!?…]*["')\]]*/g)
      .map((s) => s.trim().replace(/^[—–-]\s*/, '')).filter(Boolean);
    const chunks = sentences.flatMap((s) => splitLong(s, width * 2));
    const { start, end } = timeline[i];
    const total = chunks.reduce((n, c) => n + Math.max(wordCount(c), 1), 0);
    let t = start;
    for (const chunk of chunks) {
      const d = ((Math.max(wordCount(chunk), 1)) / total) * (end - start);
      cues.push({ start: t, end: t + d, text: wrapCaption(chunk, width) });
      t += d;
    }
  });
  return cues.map((c, n) => `${n + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n');
}

/** Split text longer than `max` characters into roughly equal parts on word boundaries. */
function splitLong(text, max) {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  const parts = Math.ceil(text.length / max);
  const per = Math.ceil(words.length / parts);
  const out = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(' '));
  return out;
}

/**
 * Pause midpoints from ffmpeg's silencedetect log
 * ("silence_start: 3.2" ... "silence_end: 3.9 | silence_duration: 0.7").
 */
export function parseSilences(ffmpegLog) {
  const out = [];
  let start = null;
  for (const line of String(ffmpegLog).split(/\r?\n/)) {
    const s = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (s) { start = Math.max(0, parseFloat(s[1])); continue; }
    const e = line.match(/silence_end:\s*([\d.]+)/);
    if (e && start != null) { out.push((start + parseFloat(e[1])) / 2); start = null; }
  }
  return out;
}
