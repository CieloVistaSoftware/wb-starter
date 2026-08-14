/**
 * COMPLIANCE GATE: every `<wb-audio>`/`<audio>` in the repo must have a
 * resolvable src -- either a `src` attribute on the element itself, or at
 * least one `<source src="...">` child (the standard HTML5 pattern).
 *
 * src/wb-viewmodels/semantics/audio.js throws `wb-audio: no src provided --
 * nothing to play` when NEITHER is present (#433, deliberately, so a broken
 * player can't ship silently). That guard originally only checked the `src`
 * ATTRIBUTE, not `<source>` children -- demos/autoinject.html's 4 audio
 * players use exactly the `<source src="...">` pattern (valid, standard
 * markup the browser plays fine) and threw on every one of them until the
 * fix landed alongside this test. This gate catches the authoring mistake
 * (an element with genuinely NEITHER) statically, before it ever reaches a
 * browser and writes to data/errors.json.
 *
 * SCOPE: demos/, pages/, and docs/ (.md files -- markdown code FENCES are
 * stripped first, matching docs-live-media-assets-exist.spec.ts's
 * convention, so a src-less <wb-audio> shown as illustrative text inside a
 * ```html fence is fine -- nothing loads it live).
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
const SCAN_ROOTS = ['demos', 'pages', 'docs'];

function collectFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, exts, acc);
    else if (exts.some((e) => entry.name.endsWith(e))) acc.push(full);
  }
  return acc;
}

function filesToCheck(): string[] {
  const acc: string[] = [];
  for (const root of SCAN_ROOTS) {
    collectFiles(path.join(ROOT, root), ['.html', '.md'], acc);
  }
  return acc.map((f) => path.relative(ROOT, f).split(path.sep).join('/')).sort();
}

/**
 * Strip fenced code blocks AND inline code spans -- markdown docs only,
 * harmless no-op on .html. Inline spans matter here: a doc's Overview table
 * routinely writes `` `<wb-audio>` `` as prose (naming the tag), and without
 * stripping it the regex below treats that bare, attribute-less mention as
 * a real opening tag, then non-greedily scans forward for the next literal
 * `</audio>`/`</wb-audio>` ANYWHERE later in the file -- the same "prose
 * mention parsed as real markup" bug class just fixed in
 * src/wb-viewmodels/page-source-cache.js for a different reason.
 */
function liveMarkupOnly(src: string): string {
  return src
    .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

// Matches a whole <audio ...>...</audio> or <wb-audio ...>...</wb-audio>
// block (attributes may span multiple lines), capturing the opening tag's
// attributes and the full inner content separately.
const AUDIO_BLOCK = /<(wb-audio|audio)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi;
const HAS_SRC_ATTR = /\ssrc\s*=\s*["'][^"']*\S[^"']*["']/i;
const HAS_SOURCE_SRC_CHILD = /<source\b[^>]*\ssrc\s*=\s*["'][^"']*\S[^"']*["']/i;

test.describe('Every <wb-audio>/<audio> has a resolvable src (attribute or <source> child)', () => {
  for (const rel of filesToCheck()) {
    const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const live = rel.endsWith('.md') ? liveMarkupOnly(raw) : raw;
    if (!AUDIO_BLOCK.test(live)) continue;
    AUDIO_BLOCK.lastIndex = 0;

    test(`${rel}: all audio elements resolve a real src`, () => {
      const offenders: string[] = [];
      let m: RegExpExecArray | null;
      let index = 0;
      while ((m = AUDIO_BLOCK.exec(live)) !== null) {
        index++;
        const [, tag, attrs, inner] = m;
        const hasSrcAttr = HAS_SRC_ATTR.test(attrs);
        const hasSourceChild = HAS_SOURCE_SRC_CHILD.test(inner);
        if (!hasSrcAttr && !hasSourceChild) {
          offenders.push(`<${tag}> instance #${index} has neither a src attribute nor a <source src="..."> child`);
        }
      }

      expect(
        offenders,
        `${rel} has audio element(s) with no resolvable src:\n  ` +
        offenders.join('\n  ') +
        `\n\naudio.js throws "wb-audio: no src provided" for these at runtime (#433) -- ` +
        `add a src="..." attribute or a <source src="..."> child.`
      ).toEqual([]);
    });
  }
});
