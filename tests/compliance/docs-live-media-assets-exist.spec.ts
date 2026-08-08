/**
 * COMPLIANCE GATE (#514): a LIVE media example in a markdown doc must point at a
 * real asset.
 *
 * Raw HTML in a `.md` file is not a code sample -- the doc-viewer renders it
 * LIVE (DEMOS-AND-DOCS-STANDARDS.md §1: docs embed raw `<wb-demo>` blocks, the
 * viewer upgrades the `<wb-*>` / `x-*` markup inside them). So a placeholder
 * `src` like `music.mp3` is not illustrative text, it is a broken control that
 * ships:
 *
 *   - `<wb-audio>` / `<audio>` THROW. `src/wb-viewmodels/semantics/audio.js`
 *     turns the native media `error` event into a real `Error` (added by #433,
 *     deliberately, so broken audio can't ship undetected). Every single view of
 *     `docs/behaviors-reference.md` wrote a fresh entry to `data/errors.json`
 *     -- which is itself gated by `error-log-empty.spec.ts`, so one placeholder
 *     filename in a doc could redden the compliance suite.
 *   - `<wb-video>` / `<video>` / `<img>` fail SILENTLY -- no error, just a demo
 *     that renders nothing (or a broken-image glyph), violating §16 ("every demo
 *     shows a WORKING live demo AND its code").
 *
 * #500 fixed this by hand for `docs/behaviors/wb-audio.md` and
 * `docs/components/semantics/audio.md`, but missed `docs/behaviors-reference.md`
 * -- the same defect was refiled 2 days later as #514. Hand-auditing doc srcs
 * does not scale; this gate is the systemic fix.
 *
 * SCOPE -- deliberately narrow, so it stays a true signal:
 *   - Only content the doc-viewer renders live: fenced code blocks and inline
 *     code spans are stripped first. A placeholder `src` inside a ```html fence
 *     is fine -- nothing loads it.
 *   - Only media elements that fetch a resource on render.
 *   - Only RELATIVE (repo-local) srcs. Remote `https://` media is out of scope:
 *     asserting on it would put the network in the compliance suite and make it
 *     flaky. Verifying remote doc links is `doc-viewer-links`' problem.
 *
 * Resolution mirrors the doc-viewer: `rebaseDocResources()` in
 * `public/doc-viewer.html` resolves a doc's relative media against the DOC's own
 * directory, not the viewer page -- so `../demos/audio.mp3` in `docs/x.md`
 * means `<repo>/demos/audio.mp3`.
 *
 * The size floor catches the OTHER half of this bug class: an asset that exists
 * but holds no real content. `demos/image.jpg` and `demos/movie.mp4` are literal
 * 13-byte text files reading "(dummy image)" / "(dummy movie)" -- they pass an
 * existence check and still fail to decode at runtime (audio.js's error message
 * calls out the 0-byte case by name).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'data', 'test-results', '.playwright-artifacts',
  'coverage', 'dist', 'out', '.claude',
]);

/** Elements that fetch their `src` as soon as the doc-viewer renders them. */
const MEDIA_TAGS = ['wb-audio', 'wb-video', 'audio', 'video', 'source', 'img'];
const MEDIA_SRC = new RegExp(
  `<(${MEDIA_TAGS.join('|')})(\\s[^>]*?)?\\ssrc\\s*=\\s*["']([^"']+)["']`,
  'gi'
);

/** Non-repo-local srcs: remote, inline, template placeholders. */
const NOT_REPO_LOCAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\{)/i;

/**
 * Smallest plausible real media file. `favicon.png` (the smallest real image
 * committed here) is 655 bytes; the dummy placeholders are 13. 256 sits between
 * them with room on both sides.
 */
const MIN_REAL_BYTES = 256;

function mdFiles(dir: string, acc: string[] = []): string[] {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

// Known-broken, tracked separately (#519) -- found by this audit while
// fixing #514, but their placeholder assets were never part of that fix's
// scope. Remove an entry here only once #519 has actually fixed that file.
const KNOWN_BROKEN_PENDING_519 = new Set([
  'docs/behavior-cross-reference.md',
  'docs/components/semantics/img.md',
  'docs/components/semantics/video.md',
]);

function docsToCheck(): string[] {
  const files = mdFiles(path.join(ROOT, 'docs'));
  for (const name of ['README.md', 'CONTRIBUTING.md']) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) files.push(p);
  }
  return files
    .map((f) => path.relative(ROOT, f).split(path.sep).join('/'))
    .filter((rel) => !KNOWN_BROKEN_PENDING_519.has(rel))
    .sort();
}

/** Strip everything the doc-viewer shows as CODE, leaving only live markup. */
function liveMarkupOnly(src: string): string {
  return src
    .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

test.describe('Live media examples in docs point at real assets (#514)', () => {
  for (const rel of docsToCheck()) {
    test(`${rel}: live media src resolves to a real file`, () => {
      const live = liveMarkupOnly(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      const docDir = path.posix.dirname(rel);
      const offenders: string[] = [];

      for (const m of live.matchAll(MEDIA_SRC)) {
        const [, tag, , src] = m;
        if (NOT_REPO_LOCAL.test(src)) continue;

        const target = path.posix.normalize(
          path.posix.join(docDir === '.' ? '' : docDir, src)
        );
        if (target.startsWith('..')) {
          offenders.push(`<${tag} src="${src}"> escapes the repo root`);
          continue;
        }

        const abs = path.join(ROOT, target);
        if (!fs.existsSync(abs)) {
          offenders.push(`<${tag} src="${src}"> -> ${target} does not exist`);
        } else if (fs.statSync(abs).size < MIN_REAL_BYTES) {
          offenders.push(
            `<${tag} src="${src}"> -> ${target} is only ${fs.statSync(abs).size} bytes (placeholder, not real media)`
          );
        }
      }

      expect(
        offenders,
        `${rel} renders LIVE media pointing at asset(s) that aren't there.\n  ` +
        offenders.join('\n  ') +
        `\n\nA raw <wb-audio>/<img>/... in markdown is rendered live by the doc-viewer, ` +
        `so a placeholder filename ships a broken control (and <wb-audio> throws into ` +
        `data/errors.json on every page view -- see #514).\n` +
        `Fix: point it at a real committed asset with a path relative to THIS doc ` +
        `(e.g. "../demos/audio.mp3"), or move the snippet into a \`\`\`html fence if it ` +
        `is meant to be read, not run.`
      ).toEqual([]);
    });
  }
});
