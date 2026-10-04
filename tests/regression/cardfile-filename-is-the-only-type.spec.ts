import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

/**
 * #1119 / #1113 -- a file card has ONE way to say what kind of file it is: its name.
 *
 * John: "why are you keeping file-type? get rid of it. use only filenames and
 * give enough examples for each" (#1119), and, pointing at an example with two
 * of them, "THERE SHOULD ONLY BE ONE FILETYPE ATTRIBUTE" (#1113).
 *
 * #1117 derived the icon from the filename but kept `fileType` as an override,
 * which is what let an example say file-type="video" over "report.pdf". Now the
 * attribute is not read at all, and nothing that teaches cardfile writes it.
 */

const FAMILIES: Array<[string, string]> = [
  ['quarterly-report.pdf', '📄'],
  ['meeting-notes.docx', '📝'],
  ['architecture-diagram.png', '🖼️'],
  ['product-walkthrough.mp4', '🎬'],
  ['interview-recording.m4a', '🎵'],
  ['release-assets.zip', '📦'],
  ['sensor-capture.bin', '📁'],
  ['README', '📁'],
];

async function iconFor(page, markup: string) {
  return page.evaluate(async (html) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });
    return host.querySelector('.x-card__file-icon')?.textContent ?? null;
  }, markup);
}

test.describe('#1119 the filename is the only file type', () => {
  test('every extension family picks its own icon from the name alone', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    for (const [name, icon] of FAMILIES) {
      expect(await iconFor(page, `<article x-cardfile filename="${name}"></article>`), name).toBe(icon);
    }
  });

  test('a file-type attribute changes nothing: report.pdf stays a PDF', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    for (const attr of ['file-type="video"', 'fileType="video"', 'type="video"']) {
      expect(await iconFor(page, `<article x-cardfile filename="quarterly-report.pdf" ${attr}></article>`),
        `${attr} must not override the filename`).toBe('📄');
    }
  });

  test('nothing that teaches cardfile writes a type attribute', () => {
    const sources = [
      'src/wb-models/cardfile.schema.json',
      'docs/behaviors/cardfile.md',
      'data/behavior-examples.json',
      'demos/site/cards.html',
      'demos/playground.html',
      'src/wb-models/pages/behaviors-card-code.page.json',
    ];
    const offenders: string[] = [];
    for (const f of sources) {
      const text = readFileSync(f, 'utf8');
      // Any cardfile tag (in markup, JSON-escaped markup, or a page-model attrs
      // object near "x-cardfile") that carries file-type / fileType.
      for (const m of text.matchAll(/x-cardfile[^>\n]*?\b(file-type|fileType)\b/gi)) offenders.push(`${f}: ${m[0].slice(0, 90)}`);
      if (f.endsWith('cardfile.schema.json') && /"fileType"/.test(text)) offenders.push(`${f}: still declares fileType`);
    }
    expect(offenders, 'cardfile is taught with exactly one type signal: the filename').toEqual([]);
  });
});
