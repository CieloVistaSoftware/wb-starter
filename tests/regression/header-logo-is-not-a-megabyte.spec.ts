import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REGRESSION: the header logo is not a megabyte (#795)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHAT WENT WRONG
 *
 * `config/site.json` rendered the header mark as:
 *
 *     <img src='images/wb.png' alt='WB Logo' style='height: 2rem; width: auto;' />
 *
 * `images/wb.png` was 1,577,322 bytes of 1024x1024 RGBA PNG -- including a
 * 68,834-byte `caBX` editor-metadata chunk -- painted at 2rem, i.e. 32 CSS
 * pixels. Every visitor on every page downloaded ~1.5 MB and decoded ~4 MB of
 * bitmap to draw a 32-pixel mark. Being the heaviest asset on the page, it was
 * also the first to lose a race when the dev server was slow, which is how it
 * reached the error log as "Image failed to load after 5 attempt(s)".
 *
 * WHY A SIZE ASSERTION AND NOT A VISIBILITY ONE
 *
 * "the logo renders" was TRUE the whole time the defect existed. A guard that
 * only checks that an image appears would have passed against the 1.5 MB file
 * and is worth nothing here. The defect is measured in BYTES, so the test
 * measures bytes and prints the real number when it fails.
 *
 * WHY NOT JUST SHIP A SMALLER PNG
 *
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md section 29 -- "Media sources are
 * REMOTE, images included... NO LOCAL IMAGES" (#762). A newly committed raster
 * would trade one standing violation for another. A remote URL is also wrong
 * for site chrome: `tests/compliance/no-external-requests.spec.ts` requires the
 * site to render with nothing escaping to the internet, and a logo is not
 * sample media. The mark is therefore an INLINE SVG in the config string --
 * vector, themed through `currentColor`, and zero bytes over the wire, because
 * there is no second request at all.
 */

const ROOT = process.cwd();

/**
 * The ceiling, in bytes, for any single image the running site can serve.
 *
 * 100 KB is deliberately loose: it is not a target, it is a tripwire for an
 * asset that was never resized. With this change the largest thing under these
 * directories is a 23,311-byte photograph, so the ceiling leaves four times
 * that much headroom and still catches the 1.5 MB class of mistake instantly.
 */
const MAX_IMAGE_BYTES = 100 * 1024;

/** Directories whose images are served to a visitor of the running site. */
const SERVED_DIRS = ['images', 'assets', 'public', 'pages'];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|avif|svg|ico)$/i;
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'data', 'test-results', '.playwright-artifacts',
  'coverage', 'dist', 'out', '.claude', 'archive',
]);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walk(full, out);
    else if (IMAGE_EXT.test(entry)) out.push(full);
  }
  return out;
}

function servedImages(): Array<{ rel: string; bytes: number }> {
  const out: Array<{ rel: string; bytes: number }> = [];
  for (const dir of SERVED_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      out.push({
        rel: relative(ROOT, file).replace(/\\/g, '/'),
        bytes: statSync(file).size,
      });
    }
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

function kb(bytes: number): string {
  return `${bytes.toLocaleString('en-US')} bytes (${(bytes / 1024).toFixed(1)} KB)`;
}

/** The intrinsic pixel size of a PNG, read from its IHDR header. */
function pngSize(file: string): { width: number; height: number } | null {
  const b = readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return null; // 'IHDR'
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function headerLogoMarkup(): string {
  const config = JSON.parse(readFileSync(join(ROOT, 'config', 'site.json'), 'utf8'));
  return String(config?.branding?.headerLogoImage ?? '');
}

test.describe('Header logo is not a megabyte (#795)', () => {
  test('no image the site serves exceeds the size ceiling', () => {
    const images = servedImages();
    const over = images.filter((i) => i.bytes > MAX_IMAGE_BYTES);

    const report = over
      .map((i) => {
        const px = i.rel.endsWith('.png') ? pngSize(join(ROOT, i.rel)) : null;
        const dims = px ? ` -- ${px.width}x${px.height}` : '';
        return `    ${i.rel}: ${kb(i.bytes)}${dims}, ` +
               `${(i.bytes / MAX_IMAGE_BYTES).toFixed(1)}x the ${kb(MAX_IMAGE_BYTES)} ceiling`;
      })
      .join('\n');

    expect(
      over.map((i) => i.rel),
      `${over.length} served image(s) are over the ceiling. Every visitor pays these ` +
      `bytes on page load.\n${report}\n\n` +
      `  Scanned ${images.length} images under ${SERVED_DIRS.join('/, ')}/.\n` +
      `  Largest that passes: ${images.filter((i) => i.bytes <= MAX_IMAGE_BYTES)
        .slice(0, 1).map((i) => `${i.rel} at ${kb(i.bytes)}`).join('') || 'none'}\n` +
      `  A logo is vector (inline SVG), not a bitmap. Media sources are remote ` +
      `(DEMOS-AND-DOCS-STANDARDS section 29) -- committing a smaller raster is not the fix.\n`,
    ).toEqual([]);
  });

  test('the header mark costs no bytes: it is inline, not a fetched file', () => {
    const markup = headerLogoMarkup();

    expect(markup, 'config/site.json branding.headerLogoImage is empty').not.toBe('');

    // Any src= in the header mark is a request every visitor makes before the
    // page can finish painting. Name it, and weigh it.
    const srcs = [...markup.matchAll(/\ssrc\s*=\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const weighed = srcs.map((src) => {
      const rel = src.replace(/^\/+/, '');
      const abs = join(ROOT, rel);
      const bytes = existsSync(abs) ? statSync(abs).size : -1;
      return { src, bytes };
    });
    const tooBig = weighed.filter((w) => w.bytes > MAX_IMAGE_BYTES);

    expect(
      tooBig.map((w) => `${w.src} = ${kb(w.bytes)}`),
      `The header logo fetches a file over the ${kb(MAX_IMAGE_BYTES)} ceiling. ` +
      `This is downloaded on every page load, by every visitor, in the header, ` +
      `to paint a 2rem mark.\n  ${markup.slice(0, 200)}\n`,
    ).toEqual([]);
  });

  test('the header mark carries no inline style and reserves its own box', () => {
    const markup = headerLogoMarkup();

    // Defect 2 of #795: the sizing was a style="" attribute inside a JSON
    // config file, so no-inline-styles.spec.ts (which scans .js/.mjs and .html)
    // could not see it. Sizing belongs in a stylesheet rule on the mark's class.
    expect(
      /\sstyle\s*=/.test(markup),
      `config/site.json branding.headerLogoImage carries a style="" attribute. ` +
      `It is an HTML fragment inside JSON, so no inline-style gate scans it -- ` +
      `which is exactly why the 2rem sizing hid there for months. Put it in a ` +
      `stylesheet rule keyed to the mark's class.\n  ${markup.slice(0, 200)}\n`,
    ).toBe(false);

    // No intrinsic size means the header reflows the moment the mark resolves.
    const hasBox = /\swidth\s*=\s*['"]/.test(markup) && /\sheight\s*=\s*['"]/.test(markup);
    expect(
      hasBox,
      `The header mark declares no width/height, so the header has no box to ` +
      `reserve and shifts when the mark lands.\n  ${markup.slice(0, 200)}\n`,
    ).toBe(true);
  });

  test('the stylesheet, not the config, sizes the mark', () => {
    const markup = headerLogoMarkup();
    const cls = markup.match(/\sclass\s*=\s*['"]([^'"]+)['"]/)?.[1]?.split(/\s+/)[0];

    expect(cls, 'the header mark carries no class for a stylesheet to reach').toBeTruthy();

    const css = readFileSync(join(ROOT, 'src', 'styles', 'site.css'), 'utf8');
    expect(
      css.includes(`.${cls}`),
      `No rule for .${cls} in src/styles/site.css. The sizing that used to be an ` +
      `inline style has to land somewhere a theme and a gate can both see.`,
    ).toBe(true);
  });

  test('the 1.5 MB logo bitmap is gone from the repo', () => {
    const abs = join(ROOT, 'images', 'wb.png');
    const bytes = existsSync(abs) ? statSync(abs).size : 0;
    const px = bytes ? pngSize(abs) : null;

    expect(
      bytes,
      `images/wb.png is still committed: ${kb(bytes)}` +
      `${px ? `, ${px.width}x${px.height}` : ''}. It was rendered at 32 CSS pixels. ` +
      `Nothing should reference it, and a repo-committed raster is not how this ` +
      `project ships media (DEMOS-AND-DOCS-STANDARDS section 29, #762).`,
    ).toBe(0);
  });

  test('nothing references the deleted bitmap', () => {
    const SEARCH_DIRS = ['config', 'src', 'scripts', 'pages', 'tests', 'docs', 'packages', 'public'];
    const TEXT_EXT = /\.(json|js|mjs|cjs|ts|tsx|html|md|css)$/i;
    const hits: string[] = [];

    for (const dir of SEARCH_DIRS) {
      const base = join(ROOT, dir);
      let files: string[] = [];
      try { files = walkText(base); } catch { continue; }
      for (const file of files) {
        const rel = relative(ROOT, file).replace(/\\/g, '/');
        // This spec names the file on purpose, in prose and in the assertion.
        if (rel.endsWith('header-logo-is-not-a-megabyte.spec.ts')) continue;
        // Comment-blank first: a comment that says "this USED to be
        // images/wb.png, here is why it is not any more" is the record of the
        // fix, not a reference to the file. Blanking preserves line numbers.
        const src = /\.(js|mjs|cjs|ts|tsx|css)$/i.test(file)
          ? readFileSync(file, 'utf8')
              .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
              .replace(/(^|[^:])\/\/[^\n]*/g, (_m, p1) => p1)
          : readFileSync(file, 'utf8');
        src.split('\n').forEach((line, i) => {
          // `/gone/wb.png` in dead-server-is-one-error-not-many.spec.ts is a
          // deliberately unreachable path, not a reference to the asset.
          if (/images\/wb\.png/.test(line)) hits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
        });
      }
    }

    function walkText(dir: string, out: string[] = []): string[] {
      let entries: string[];
      try { entries = readdirSync(dir); } catch { return out; }
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        let s;
        try { s = statSync(full); } catch { continue; }
        if (s.isDirectory()) walkText(full, out);
        else if (TEXT_EXT.test(entry)) out.push(full);
      }
      return out;
    }

    expect(
      hits,
      `${hits.length} reference(s) to the deleted images/wb.png remain. Each one is ` +
      `a 404 at best and a 1.5 MB download at worst.\n    ${hits.join('\n    ')}\n`,
    ).toEqual([]);
  });
});
