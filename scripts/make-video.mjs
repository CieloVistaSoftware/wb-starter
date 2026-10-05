/**
 * make-video.mjs -- one command from a narration MP3 to a finished video.
 *
 * John, 2026-10-05: "I just want to click something to make the video with
 * audio."
 *
 * A video is described once, in data/video/<name>.json: an ordered list of
 * scenes, each with the narration spoken over it and what to show (a title
 * card, a live page of the site, or a small WB demo the recorder interacts
 * with). This script:
 *
 *   1. reads the narration audio (data/video/audio/<name>.mp3) and finds its
 *      pauses, so scene changes land between sentences;
 *   2. starts the site (or uses --site), opens each scene in Chromium and
 *      records it for exactly its share of the narration;
 *   3. joins the clips, burns in captions and lays the audio under them.
 *
 * Output: data/video/out/<name>.mp4 (and <name>.srt next to it).
 *
 * Usage:
 *   npm run make-video                         # wb-starter-intro
 *   npm run make-video -- wb-starter-short     # the 60-second Short
 *   npm run make-video -- <name> --script      # print the text to paste into ElevenLabs
 *   npm run make-video -- <name> --audio path/to/voice.mp3
 *   npm run make-video -- <name> --site https://cielovistasoftware.github.io/wb-starter/
 *
 * With no audio file yet it still renders a silent preview, timed at 150 words
 * a minute, so the visuals can be checked before the voice is generated.
 *
 * Needs ffmpeg on PATH (Windows: `winget install Gyan.FFmpeg`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  narrationScript, estimateSeconds, planTimeline, buildSrt, parseSilences,
} from './lib/video-timeline.mjs';
import { probeFreePort } from './lib/free-port.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = path.join(ROOT, 'data', 'video');

// ─── arguments ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = args.find((a, i) => !a.startsWith('--') && !['--audio', '--site', '--out'].includes(args[i - 1])) || 'wb-starter-intro';
const specPath = path.join(VIDEO_DIR, `${name}.json`);
if (!fs.existsSync(specPath)) {
  const known = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  fail(`no video named "${name}". Known: ${known.join(', ')}`);
}
const video = JSON.parse(fs.readFileSync(specPath, 'utf8'));

if (args.includes('--script')) {
  console.log(narrationScript(video));
  process.exit(0);
}

const audioPath = path.resolve(flag('--audio') || path.join(VIDEO_DIR, 'audio', `${name}.mp3`));
const outDir = path.resolve(flag('--out') || path.join(VIDEO_DIR, 'out'));
const width = video.width || 1920;
const height = video.height || 1080;
// The browser renders at a smaller viewport and the recording is scaled up to
// the output size, so the site appears at a natural reading size.
const scale = video.scale || (width > height ? 1.5 : 2);
const viewport = { width: Math.round(width / scale), height: Math.round(height / scale) };

main().catch((err) => fail(err && err.stack ? err.stack : String(err)));

async function main() {
  requireFfmpeg();
  fs.mkdirSync(outDir, { recursive: true });
  const work = fs.mkdtempSync(path.join(outDir, `.${name}-`));

  // 1. Narration length and pauses.
  const hasAudio = fs.existsSync(audioPath);
  let total;
  let silences = [];
  if (hasAudio) {
    total = audioSeconds(audioPath);
    silences = parseSilences(ffmpeg(['-i', audioPath, '-af', 'silencedetect=noise=-35dB:d=0.3', '-f', 'null', '-']).stderr);
    console.log(`Narration: ${path.relative(ROOT, audioPath)} (${total.toFixed(1)}s, ${silences.length} pauses)`);
  } else {
    total = estimateSeconds(video);
    console.log(`No narration at ${path.relative(ROOT, audioPath)}. Rendering a silent preview (${total.toFixed(1)}s at 150 words a minute).`);
    console.log(`  Generate the voice from:  npm run make-video -- ${name} --script`);
  }
  const timeline = planTimeline(video, total, { silences });

  // 2. Record every scene.
  const site = await openSite(flag('--site'));
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ executablePath: process.env.WB_VIDEO_CHROMIUM || undefined });
  const clips = [];
  try {
    for (let i = 0; i < video.scenes.length; i++) {
      const { start, end } = timeline[i];
      const seconds = end - start;
      process.stdout.write(`Scene ${i + 1}/${video.scenes.length} (${video.scenes[i].show.type}, ${seconds.toFixed(1)}s)... `);
      clips.push(await recordScene(browser, site.url, video.scenes[i].show, seconds, work, i));
      console.log('done');
    }
  } finally {
    await browser.close();
    site.stop();
  }

  // 3. Join, caption, add audio.
  fs.writeFileSync(path.join(work, 'clips.txt'), clips.map((c) => `file '${path.basename(c)}'`).join('\n'));
  ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', 'clips.txt', '-c', 'copy', 'body.mp4'], { cwd: work });

  const portrait = height > width;
  const srt = buildSrt(video, timeline, { width: portrait ? 24 : 42 });
  fs.writeFileSync(path.join(work, 'captions.srt'), srt);
  // libass sizes SRT captions against a 288-line canvas, so these are relative.
  const style = portrait
    ? 'FontName=Arial,FontSize=11,Bold=1,Outline=2,Shadow=0,MarginV=40,BorderStyle=1'
    : 'FontName=Arial,FontSize=16,Bold=1,Outline=2,Shadow=0,MarginV=18,BorderStyle=1';
  const audioIn = hasAudio ? ['-i', audioPath] : ['-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo'];
  const outFile = path.join(outDir, `${name}${hasAudio ? '' : '-preview'}.mp4`);
  ffmpeg(['-y', '-i', 'body.mp4', ...audioIn,
    '-vf', `subtitles=captions.srt:force_style='${style}'`,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-t', String(total), outFile], { cwd: work });
  fs.copyFileSync(path.join(work, 'captions.srt'), outFile.replace(/\.mp4$/, '.srt'));
  fs.rmSync(work, { recursive: true, force: true });

  console.log(`\nVideo: ${path.relative(ROOT, outFile)} (${total.toFixed(1)}s, ${width}x${height})`);
}

// ─── scenes ───────────────────────────────────────────────────────────────

/** Record one scene for `seconds` and return the path of an H.264 clip of exactly that length. */
async function recordScene(browser, siteUrl, show, seconds, work, index) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 1, colorScheme: 'dark',
    // Recorded at the viewport's own size: Playwright pads a larger size
    // rather than scaling, so the clip is scaled up by ffmpeg below.
    recordVideo: { dir: work, size: viewport },
  });
  const opened = Date.now();
  const page = await context.newPage();

  if (show.type === 'card') {
    await page.setContent(cardHtml(show), { waitUntil: 'load' });
  } else if (show.type === 'page') {
    const url = new URL(show.path || '', siteUrl);
    const pageId = url.searchParams.get('page') || 'home';
    await page.goto(url.href, { waitUntil: 'load' });
    // The site boots on its first page and then navigates, so wait for THIS
    // page to be on screen, not just for the site to exist.
    await page.waitForFunction((id) => window.WBSite && window.WBSite.currentPage === id
      && document.getElementById(`mainPage-${id}`), pageId, { timeout: 30000 });
    await page.waitForTimeout(1200); // let the page's behaviors build before the shot starts
  } else if (show.type === 'demo') {
    await page.goto(new URL('demos/test-harness.html', siteUrl).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.WB && window.WB.scan, null, { timeout: 30000 });
    await page.evaluate(async (html) => {
      document.body.innerHTML = `<main class="video-stage">${html}</main>`;
      const style = document.createElement('style');
      style.textContent = `
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; }
        .video-stage { width: min(34rem, 86vw); display: grid; gap: 1rem; font-size: 1.15rem; }
        .video-stage h3 { color: var(--text-primary, #f8fafc); }
        .video-html { margin: 0; max-width: none; padding: 1rem 1.25rem;
          background: #0b1020ee; color: #c7d2fe; border: 1px solid #334155; border-radius: .75rem;
          font: 600 .95rem/1.5 ui-monospace, Consolas, monospace; white-space: pre-wrap !important; overflow-wrap: anywhere; }
        .video-html b { color: #f472b6; }`;
      document.head.appendChild(style);
      await window.WB.scan(document.body, { eager: true });
    }, show.html);
    await page.waitForTimeout(500);
  } else {
    throw new Error(`unknown scene type "${show.type}"`);
  }

  const readyAt = (Date.now() - opened) / 1000;
  const deadline = Date.now() + seconds * 1000;
  await playScene(page, show, seconds);
  const left = deadline - Date.now();
  if (left > 0) await page.waitForTimeout(left);

  await context.close();
  const raw = await page.video().path();
  const clip = path.join(work, `clip-${String(index).padStart(2, '0')}.mp4`);
  // tpad holds the last frame: a recording can end a little short of the
  // requested time, and every short clip would pull the picture ahead of the
  // narration for the rest of the video. Each clip is exactly `seconds` long.
  ffmpeg(['-y', '-ss', readyAt.toFixed(3), '-i', raw,
    '-vf', `fps=30,scale=${width}:${height}:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration=5`,
    '-t', seconds.toFixed(3),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', clip]);
  fs.rmSync(raw, { force: true });
  return clip;
}

/** What happens on screen while the scene is recorded. */
async function playScene(page, show, seconds) {
  if (show.type === 'page' && show.scroll) {
    // Glide #siteBody (the site's scroll container) down the page over the scene.
    await page.evaluate((ms) => {
      const sb = document.getElementById('siteBody') || document.scrollingElement;
      const max = Math.max(0, Math.min(sb.scrollHeight - sb.clientHeight, window.innerHeight * 2.5));
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        sb.scrollTop = max * (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, Math.max(500, seconds * 1000 - 600));
    return;
  }
  if (show.type !== 'demo') return;

  // Spread the actions across the first two thirds of the scene.
  const actions = show.actions || [];
  const gap = (seconds * 1000 * 0.66) / (actions.length + 1);
  for (const action of actions) {
    await page.waitForTimeout(gap);
    if (action.click) {
      const box = await page.locator(action.click).first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
        await page.mouse.down();
        await page.waitForTimeout(120);
        await page.mouse.up();
      }
    } else if (action.drag) {
      const box = await page.locator(action.drag).first().boundingBox();
      if (box) {
        const [dx, dy] = action.by || [200, 0];
        const x = box.x + box.width / 2;
        const y = box.y + 24;
        await page.mouse.move(x, y, { steps: 10 });
        await page.mouse.down();
        await page.mouse.move(x + dx, y + dy, { steps: 40 });
        await page.mouse.up();
      }
    }
  }
  if (show.showHtml) {
    await page.waitForTimeout(gap);
    // What the browser's inspector would show: the element as it is now, after
    // WB has run. The point is that it is still the tag the author wrote.
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const name = el.tagName.toLowerCase();
      // One attribute per line, as the inspector wraps them, so the whole tag fits.
      const attrs = [...el.attributes].map((a) => (a.value ? `${a.name}="${a.value}"` : a.name));
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // A <div> marked x-ignore: a <pre> here would be enhanced by WB's own
      // code behavior (line numbers), which is not what an inspector shows.
      const pre = document.createElement('div');
      pre.setAttribute('x-ignore', '');
      pre.className = 'video-html';
      pre.innerHTML = `<b>Elements</b>\n${esc(`<${name}`)}\n${attrs.map((a) => `    ${esc(a)}`).join('\n')}${esc('>')}\n  …\n${esc(`</${name}>`)}`;
      // In the stage, under the element, so it never covers it or the captions.
      (document.querySelector('.video-stage') || document.body).appendChild(pre);
    }, show.showHtml);
  }
}

/** A full-frame title card. Sizes follow the frame so one card works for 16:9 and 9:16. */
function cardHtml(show) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const portrait = height > width;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; height: 100%; }
    body { display: grid; place-items: center; background: radial-gradient(circle at 30% 20%, #1e293b, #020617 70%);
      color: #f8fafc; font-family: "Segoe UI", system-ui, sans-serif; }
    .card { width: ${portrait ? '86vw' : '78vw'}; display: grid; gap: ${portrait ? '4vh' : '3.2vh'}; }
    h1 { margin: 0; font-size: ${portrait ? '9.5vw' : '5vw'}; line-height: 1.1; letter-spacing: -0.02em; }
    p { margin: 0; font-size: ${portrait ? '5.4vw' : '2.4vw'}; color: #a5b4fc; }
    ul { margin: 0; padding: 0; list-style: none; display: grid; gap: ${portrait ? '2vh' : '1.6vh'}; }
    li { font-size: ${portrait ? '5.6vw' : '2.4vw'}; color: #e2e8f0; }
    pre { margin: 0; padding: ${portrait ? '4vw' : '2vw 2.4vw'}; background: #0b1020; border: 1px solid #334155;
      border-radius: 1rem; color: #c7d2fe; font: 600 ${portrait ? '3.6vw' : '1.7vw'}/1.5 ui-monospace, Consolas, monospace;
      white-space: pre-wrap; }
    .bar { width: 6rem; height: .4rem; border-radius: 1rem; background: linear-gradient(90deg, #6366f1, #ec4899); }
  </style></head><body><div class="card">
    <div class="bar"></div>
    <h1>${esc(show.title || '')}</h1>
    ${show.subtitle ? `<p>${esc(show.subtitle)}</p>` : ''}
    ${show.items ? `<ul>${show.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
    ${show.code ? `<pre>${esc(show.code)}</pre>` : ''}
  </div></body></html>`;
}

// ─── the site ─────────────────────────────────────────────────────────────

/** Use --site, else start this checkout's own server on a free port. */
async function openSite(siteFlag) {
  if (siteFlag) return { url: siteFlag.endsWith('/') ? siteFlag : `${siteFlag}/`, stop() {} };
  const port = probeFreePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: 'ignore', windowsHide: true,
  });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return { url, stop: () => child.kill() };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`the site server did not start on port ${port} within 30s`);
}

// ─── ffmpeg ───────────────────────────────────────────────────────────────

function requireFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8', windowsHide: true });
  if (r.error || r.status !== 0) {
    fail('ffmpeg was not found on PATH. Install it once, then run this again:\n' +
      '  Windows:  winget install Gyan.FFmpeg   (then open a new terminal)\n' +
      '  macOS:    brew install ffmpeg');
  }
}

function ffmpeg(ffArgs, { cwd } = {}) {
  const r = spawnSync('ffmpeg', ['-hide_banner', ...ffArgs], { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 && !ffArgs.includes('null')) {
    throw new Error(`ffmpeg ${ffArgs.join(' ')} failed:\n${(r.stderr || '').split('\n').slice(-15).join('\n')}`);
  }
  return r;
}

/** Length of an audio file, from ffmpeg's own report (no ffprobe needed). */
function audioSeconds(file) {
  const m = ffmpeg(['-i', file, '-f', 'null', '-']).stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`could not read the length of ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function fail(message) {
  console.error(`make-video: ${message}`);
  process.exit(1);
}
