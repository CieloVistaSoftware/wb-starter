/**
 * make-video's timing and captions (scripts/lib/video-timeline.mjs).
 *
 * John, 2026-10-05: "I just want to click something to make the video with
 * audio." `npm run make-video` records each scene for its share of the
 * narration and burns in captions. These are the rules that decide where each
 * scene starts and what the captions say, checked without a browser or ffmpeg.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  stripAudioTags, wordCount, narrationScript, estimateSeconds,
  planTimeline, srtTime, wrapCaption, buildSrt, parseSilences,
} from '../../scripts/lib/video-timeline.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const video = {
  scenes: [
    { narration: '[curious] One two three four.' },          // 4 words
    { narration: 'Five six seven eight nine ten eleven twelve.' }, // 8 words
    { narration: 'Thirteen fourteen fifteen sixteen.', caption: 'Shown instead.' }, // 4 words
  ],
};

test('audio tags are direction, not words', () => {
  expect(stripAudioTags('[laughs] maybe… [pause] not')).toBe('maybe… not');
  expect(wordCount('[excited] Add two attributes. Done.')).toBe(4);
});

test('the ElevenLabs script is every narration, one paragraph each, tags kept', () => {
  expect(narrationScript(video).split('\n\n')).toHaveLength(3);
  expect(narrationScript(video)).toContain('[curious] One two');
});

test('a preview with no audio is timed at 150 words a minute', () => {
  expect(estimateSeconds(video)).toBeCloseTo((16 / 150) * 60, 5);
});

test('scenes split the narration by word count and cover it exactly', () => {
  const t = planTimeline(video, 32);
  expect(t.map((s) => [s.start, s.end])).toEqual([[0, 8], [8, 24], [24, 32]]);
});

test('a scene boundary moves to the nearest pause in the audio', () => {
  // Word counts put the first change at 8s; the narrator actually paused at 9.1s.
  const t = planTimeline(video, 32, { silences: [9.1, 20.0, 30.9] });
  expect(t[0].end).toBeCloseTo(9.1, 5);
  expect(t[1].start).toBeCloseTo(9.1, 5);
});

test('a pause too far away, or one that would squeeze a scene, is ignored', () => {
  expect(planTimeline(video, 32, { silences: [12] })[0].end).toBe(8); // 4s away > 1.5s window
  const tiny = planTimeline(video, 32, { silences: [0.5], snapWindow: 10 });
  expect(tiny[0].end - tiny[0].start).toBeGreaterThanOrEqual(1.5);
});

test('SRT times are hh:mm:ss,mmm', () => {
  expect(srtTime(75.5)).toBe('00:01:15,500');
  expect(srtTime(3723.004)).toBe('01:02:03,004');
});

test('captions wrap on words', () => {
  expect(wrapCaption('one two three four', 9)).toBe('one two\nthree\nfour');
});

test('captions follow the timeline, use the caption override, and drop audio tags', () => {
  const srt = buildSrt(video, planTimeline(video, 32));
  expect(srt).toContain('00:00:00,000 --> 00:00:08,000\nOne two three four.');
  expect(srt).toContain('Shown instead.');
  expect(srt).not.toContain('Thirteen');
  expect(srt).not.toContain('[curious]');
});

test('a caption never opens with a stray dash', () => {
  const srt = buildSrt({ scenes: [{ narration: 'The docs are generated — so they cannot drift.' }] }, [{ start: 0, end: 4 }]);
  expect(srt).not.toMatch(/\n[—–-]/);
});

test("ffmpeg's silencedetect log becomes pause midpoints", () => {
  const log = [
    '[silencedetect @ 0x1] silence_start: 8.4',
    '[silencedetect @ 0x1] silence_end: 9 | silence_duration: 0.6',
    '[silencedetect @ 0x1] silence_start: 17.4',
    '[silencedetect @ 0x1] silence_end: 18 | silence_duration: 0.6',
  ].join('\n');
  expect(parseSilences(log).map((n) => +n.toFixed(2))).toEqual([8.7, 17.7]);
});

test('every committed video description is playable', () => {
  const dir = path.join(REPO, 'data', 'video');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    const v = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    expect(v.scenes.length, f).toBeGreaterThan(0);
    for (const [i, s] of v.scenes.entries()) {
      expect(['card', 'page', 'demo'], `${f} scene ${i + 1}`).toContain(s.show.type);
      expect(wordCount(s.narration), `${f} scene ${i + 1} has narration`).toBeGreaterThan(0);
    }
  }
});
