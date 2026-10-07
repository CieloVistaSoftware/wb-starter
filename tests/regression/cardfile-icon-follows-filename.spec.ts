import { test, expect, type Page } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * REGRESSION (#1117 / #1114): x-cardfile's icon comes from the FILENAME.
 *
 * John, pointing at an example labelled `fileType=image` that rendered
 * `quarterly-report.pdf`: "Why do we need filetype, can't it come from the
 * filename?"
 *
 * It can. `fileType`'s only consumer was an emoji lookup (card.js), and the
 * filename sitting beside it already carried the same fact — so the two could
 * disagree, and on the Behaviors page six of seven permutations did.
 * `cardFileTypeFromName()` now derives the type from the extension.
 *
 * WHAT THIS ASSERTS, and why each part earns its place:
 *   1. every extension family renders its own icon with NO fileType authored —
 *      the derivation itself
 *   2. an unknown extension, and a name with no extension, fall back to the
 *      generic icon rather than rendering nothing or crashing
 *   3. an explicit fileType still OVERRIDES a contradicting extension — the
 *      escape hatch the schema documents for what a name cannot express
 *      (a `.bin` that really is a video). If this stops working, existing
 *      fixtures that drive `file-type=` against `filename="Sample filename"`
 *      break silently.
 *   4. the filename and the rendered icon never contradict each other — the
 *      #1114 assertion, stated as a property rather than a list of cases
 *
 * Point 3 is the one that keeps this honest: a derivation that ignored an
 * explicit attribute would be a different bug wearing this fix's clothes.
 */

/** The icon each family renders — card.js's `icons` map. */
const ICON = {
  pdf: '📄',
  doc: '📝',
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  zip: '📦',
  file: '📁',
} as const;

/** filename -> the family its extension belongs to. */
const DERIVES: Array<[string, keyof typeof ICON]> = [
  ['quarterly-report.pdf', 'pdf'],
  ['meeting-notes.docx', 'doc'],
  ['readme.md', 'doc'],
  ['architecture-diagram.png', 'image'],
  ['screenshot.jpeg', 'image'],
  ['logo.svg', 'image'],
  ['product-walkthrough.mp4', 'video'],
  ['clip.webm', 'video'],
  ['interview-recording.m4a', 'audio'],
  ['jingle.mp3', 'audio'],
  ['release-assets.zip', 'zip'],
  ['backup.tar', 'zip'],
];

/** Names that cannot name a type — both must reach the generic icon. */
const FALLS_BACK: string[] = [
  'sensor-capture.bin',   // unknown extension
  'README',               // no extension at all
  'archive.',             // trailing dot, empty extension
];

async function renderCardfile(page: Page, attrs: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });
  await page.evaluate(async (a) => {
    const host = document.getElementById('cf-host') || document.createElement('div');
    host.id = 'cf-host';
    host.innerHTML = `<article id="cf" x-cardfile ${a}></article>`;
    if (!host.isConnected) document.body.appendChild(host);
    const WB = (window as any).WB;
    await WB.scan(host, { eager: true });
  }, attrs);
  await settlePage(page, { timeout: 10000 });
  return page.evaluate(() => {
    const card = document.getElementById('cf')!;
    // The icon is the first child span card.js builds.
    const iconEl = card.querySelector('span');
    return {
      icon: (iconEl?.textContent || '').trim(),
      filename: (card.querySelector('.x-card__filename')?.textContent || '').trim(),
    };
  });
}

test.describe('#1117 — the cardfile icon is derived from the filename', () => {
  for (const [filename, family] of DERIVES) {
    test(`${filename} renders the ${family} icon with no fileType authored`, async ({ page }) => {
      const got = await renderCardfile(page, `filename="${filename}"`);
      expect(got.icon, `${filename} should derive the ${family} icon`).toBe(ICON[family]);
      expect(got.filename, 'the filename still renders as authored').toBe(filename);
    });
  }

  for (const filename of FALLS_BACK) {
    test(`${JSON.stringify(filename)} falls back to the generic icon`, async ({ page }) => {
      const got = await renderCardfile(page, `filename="${filename}"`);
      expect(got.icon, 'a name that cannot state a type gets the generic icon').toBe(ICON.file);
    });
  }

  // #1119 superseded #1117's escape hatch. John: "why are you keeping
  // file-type? get rid of it. use only filenames." These two cases used to
  // assert the override; they now assert it is gone -- the filename decides.
  test('a file-type attribute no longer overrides the extension (#1119)', async ({ page }) => {
    const got = await renderCardfile(page, 'filename="sensor-capture.bin" file-type="video"');
    expect(got.icon, 'file-type is not read: a .bin is a generic file').toBe(ICON.file);
  });

  test('a file-type attribute alone does not set the icon (#1119)', async ({ page }) => {
    const got = await renderCardfile(page, 'filename="Sample filename" file-type="image"');
    expect(got.icon, 'a name with no extension gets the generic icon, whatever file-type says').toBe(ICON.file);
  });
});

test.describe('#1114 — no cardfile example contradicts its own filename', () => {
  test('every rendered cardfile on the Behaviors page agrees with its extension', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 30000 });
    // The page builds its 767 rows asynchronously, after fetching
    // behavior-examples.json and schema-index.json. Querying as soon as the
    // search box exists finds ZERO rows and skips -- measured 2026-09-12, this
    // guard skipped and therefore proved nothing. Wait for the rows themselves.
    await page.waitForFunction(
      () => document.querySelectorAll('.behaviors-search-results__row').length > 10,
      { timeout: 30000 },
    );

    // Walk the cardfile permutations the page generates and compare what the
    // icon says against what the filename says. This is the assertion that
    // would have caught the screenshot: fileType=image on quarterly-report.pdf.
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('.behaviors-search-results__row')]
        .map((r, i) => ({ i, label: (r as HTMLElement).dataset.label || '' }))
        .filter((r) => r.label === 'cardfile' || r.label === 'x-cardfile'));

    // Not test.skip(): a guard that quietly skips when its selector stops
    // matching is the #1091 failure mode -- green while asserting nothing.
    expect(rows.length, 'no cardfile permutations found — the row selector has drifted').toBeGreaterThan(0);

    const EXT_FAMILY: Record<string, string> = {
      pdf: '📄', doc: '📝', docx: '📝', rtf: '📝', odt: '📝', txt: '📝', md: '📝',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️', avif: '🖼️',
      mp4: '🎬', mov: '🎬', webm: '🎬', mkv: '🎬',
      mp3: '🎵', wav: '🎵', m4a: '🎵', ogg: '🎵', flac: '🎵',
      zip: '📦', tar: '📦', gz: '📦', '7z': '📦', rar: '📦',
    };

    const mismatches: string[] = [];
    for (const { i } of rows) {
      await page.evaluate((idx) => {
        (document.querySelectorAll('.behaviors-search-results__row')[idx] as HTMLElement)?.click();
      }, i);
      await settlePage(page, { timeout: 5000 }).catch(() => undefined);

      const seen = await page.evaluate(() => {
        const card = document.querySelector('#behaviors-live-stage [x-cardfile]');
        if (!card) return null;
        return {
          icon: (card.querySelector('span')?.textContent || '').trim(),
          filename: (card.querySelector('.x-card__filename')?.textContent || '').trim(),
        };
      });
      if (!seen || !seen.filename) continue;

      const ext = seen.filename.includes('.') ? seen.filename.split('.').pop()!.toLowerCase() : '';
      const expected = EXT_FAMILY[ext] || '📁';
      if (seen.icon && seen.icon !== expected) {
        mismatches.push(`"${seen.filename}" rendered ${seen.icon}, its extension says ${expected}`);
      }
    }

    expect(
      mismatches,
      `a cardfile example must not contradict its own filename:\n  ${mismatches.join('\n  ')}`
    ).toEqual([]);
  });
});
