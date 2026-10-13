import { test, expect } from '../fixtures/offline';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

/**
 * John, 2026-10-13: "every file card is supposed to download that file".
 *
 * The file cards on the docs, the playground and demos/site/cards.html showed
 * a filename and a download arrow, but their href was "#", example.com, or
 * missing -- so a click "downloaded" the page the card sat on, or nothing.
 * Every example now names a real file under files/, and x-cardfile resolves a
 * site-relative href from the site root, so the same card works from any page.
 */
const root = process.cwd();
const SOURCES = [
  'src/wb-models/cardfile.schema.json',
  'src/wb-models/pages/x-component-library.site.json',
  'demos/playground.html',
  'data/behavior-examples.json',
  'docs/behaviors/cardfile.md',
  ...readdirSync(path.join(root, 'demos/site')).filter((f) => f.endsWith('.html')).map((f) => `demos/site/${f}`),
];

/** Every x-cardfile tag in a source, with its filename and href (quotes may be escaped). */
function fileCards(text: string) {
  const out: { tag: string; filename: string | null; href: string | null }[] = [];
  for (const m of text.matchAll(/<[a-z][\w-]*\b[^>]*?\bx-cardfile\b[^>]*>/g)) {
    const tag = m[0].replace(/\\"/g, '"');
    out.push({
      tag,
      filename: tag.match(/\bfilename="([^"]*)"/)?.[1] ?? null,
      href: tag.match(/\bhref="([^"]*)"/)?.[1] ?? null,
    });
  }
  return out;
}

const MEDIA = /\.(mp3|mp4|wav|ogg|oga|webm|m4a|aac|flac|mov|svg|png|jpe?g|gif|webp|avif)$/i;

test('every file card that names a file downloads that file', () => {
  const problems: string[] = [];
  let seen = 0;
  for (const src of SOURCES) {
    for (const card of fileCards(readFileSync(path.join(root, src), 'utf8'))) {
      // A bare <x-cardfile> (the schema's own default-rendering setup) names
      // no file, so it has nothing to download. Every card that NAMES a file
      // must download that file.
      if (!card.filename) continue;
      seen++;
      // Images, audio and video are never committed (#762, media-sources-are-
      // remote.spec.ts), so those cards download a remote https file of the
      // same type. Everything else downloads its own file from files/.
      if (MEDIA.test(card.filename)) {
        if (!card.href?.startsWith('https://')) problems.push(`${src}: media file card needs a remote https href -- ${card.tag}`);
        else if (path.extname(card.href).toLowerCase() !== path.extname(card.filename).toLowerCase()) problems.push(`${src}: shows "${card.filename}" but downloads ${card.href}`);
        continue;
      }
      if (!card.href || !card.href.startsWith('files/')) { problems.push(`${src}: no files/ href -- ${card.tag}`); continue; }
      if (!existsSync(path.join(root, card.href))) problems.push(`${src}: ${card.href} does not exist`);
      if (path.basename(card.href) !== card.filename) problems.push(`${src}: shows "${card.filename}" but downloads ${card.href}`);
    }
  }
  expect(seen, 'the sources should contain file card examples').toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

test('a file card two folders deep downloads its file, resolved from the site root', async ({ page }) => {
  await page.goto('/demos/site/cards.html');
  const card = page.locator('#cardfile-file-card [x-cardfile]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('role', 'button', { timeout: 15_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), card.click()]);
  expect(download.suggestedFilename()).toBe('quarterly-report.pdf');
  expect(new URL(download.url()).pathname).toBe('/files/quarterly-report.pdf');
});

test('href="#" names no file, so the card is not offered as a download', async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
  const state = await page.evaluate(async () => {
    const { cardfile } = await import('/src/wb-viewmodels/card.js');
    const el = document.body.appendChild(document.createElement('article'));
    el.setAttribute('filename', 'quarterly-report.pdf');
    el.setAttribute('href', '#');
    cardfile(el);
    return { role: el.getAttribute('role'), arrow: !!el.querySelector('.x-card__file-download') };
  });
  expect(state).toEqual({ role: null, arrow: false });
});
