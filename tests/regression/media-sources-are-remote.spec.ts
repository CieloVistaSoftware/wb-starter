/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Audio and video sources are remote, never files in this repo (#762)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "i've told you all audio and video must be from out there not local."
 *
 * "told you" is the part that matters — the rule was restated and violated
 * again, so it needs a gate rather than another round of find-and-replace.
 *
 * WHY IT MATTERS MORE THAN TIDINESS
 *
 * These strings are copy-paste examples. A relative src resolves against
 * whatever page the customer pasted it into, so it works here and 404s
 * everywhere else. It had already rotted inside the repo too: the cardvideo
 * example shipped `src="/demos/sample.mp4"`, and that file has never existed
 * (confirmed against the deployed site: 404). That is what produced the
 * "⚠ Video unavailable" placeholder John screenshotted.
 *
 * STATIC, NOT RENDERED
 *
 * This reads files rather than driving a browser, deliberately: a test that
 * loaded the media would fail whenever an external host hiccupped, and a
 * flaky gate is worse than no gate. The rule is about what the source says.
 */

import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM: no __dirname here (the repo is modules-only). Sibling regression specs
// derive it the same way.
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SCAN_DIRS = ['src', 'demos', 'pages'];
const SCAN_EXT = new Set(['.html', '.js', '.json', '.md']);

/** Historical prose is a record of what happened; it is not an example. */
const EXEMPT_FILES = [
  /whats-new\.html$/,
  /CHANGELOG/i,
  /[\/]data[\/]/,          // generated indexes, rebuilt from the sources above
  /node_modules/,
  /[\/]tests?[\/]/,
];

const MEDIA_EXT = String.raw`mp3|mp4|wav|ogg|oga|webm|m4a|aac|flac|mov`;

/**
 * A media path that is NOT absolute http(s) or a data:/blob: URI.
 *
 * Anchored to the attributes that actually FETCH something. An earlier version
 * matched any quoted media filename and flagged `download="ghosts-i-01.mp3"`,
 * which names the file the browser saves as — it requests nothing, so it can
 * never 404. A gate that cries wolf gets switched off, so it only looks where a
 * request is made.
 */
const LOCAL_MEDIA = new RegExp(
  String.raw`\b(?:src|href|data-src|poster)\s*[:=]\s*\\?["']((?!https?:|data:|blob:|#)[^"'\s<>()]*\.(?:${MEDIA_EXT}))`,
  'gi',
);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (EXEMPT_FILES.some((re) => re.test(full))) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

test.describe('Media sources are remote', () => {
  test('no audio or video source points at a file in this repo', () => {
    const offenders: string[] = [];

    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const text = readFileSync(file, 'utf8');
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          for (const m of line.matchAll(LOCAL_MEDIA)) {
            offenders.push(`${relative(ROOT, file)}:${i + 1}  ${m[1]}`);
          }
        });
      }
    }

    expect(
      offenders,
      `${offenders.length} local audio/video source(s). These are examples a ` +
      `customer copies: a relative path resolves against THEIR page, not ours, ` +
      `so it works here and 404s everywhere else. Use an absolute https URL.\n  ` +
      offenders.slice(0, 40).join('\n  '),
    ).toEqual([]);
  });

  /**
   * NOT asserted here: that the binaries are gone from demos/.
   *
   * They are still committed, and removing them is a separate piece of work —
   * a dozen existing tests (docs-live-media-assets-exist,
   * sw-audio-range-request, project-integrity, hydration, and others) assert
   * those exact files EXIST, so deleting them turns one rule into a dozen
   * unrelated failures. Tracked on #762.
   *
   * The reference gate above is what enforces John's rule either way: the
   * files can sit there unused, but nothing may point an example at them.
   */
});
