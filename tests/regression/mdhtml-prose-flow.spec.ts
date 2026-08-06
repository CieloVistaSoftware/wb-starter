import { test, expect } from '@playwright/test';

/**
 * #471: prose in rendered markdown must flow to the container width — never
 * hard-wrap at the SOURCE file's own line breaks ("all text must flow until
 * the end of the sentence, no 1/2 line breaks").
 *
 * Root cause was src/wb-viewmodels/mdhtml.js defaulting marked's `breaks`
 * option to true: every single \n in the source became a literal <br> in the
 * rendered HTML. Hand-authored .md files conventionally hard-wrap around
 * ~80 chars with single newlines inside a paragraph, so every one of those
 * arbitrary source positions became a real visual line break regardless of
 * the actual container width. CommonMark/GFM treats a single newline as
 * plain whitespace within a paragraph — only a blank line starts a new one.
 * The default is now `breaks: false`, opt-in per instance via
 * `breaks="true"` / `{ breaks: true }`.
 *
 * docs/V3-GUIDE.md is the live fixture: its opening paragraph spans three
 * hard-wrapped source lines and the file contains no explicit two-space
 * ("  \n") markdown hard breaks, so the correct rendering contains ZERO
 * <br> elements inside paragraphs.
 */

const DOC_FILE = 'docs/V3-GUIDE.md';
const DOC_URL = `/public/doc-viewer.html?file=${DOC_FILE}`;

async function gotoDoc(page) {
  await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = (document.getElementById('content')?.innerText || '');
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });
  // Let the async wb:mdhtml:loaded post-processing settle.
  await page.waitForTimeout(300);
}

test.describe('mdhtml: prose flows to container width (#471)', () => {
  test('fixture doc still has hard-wrapped source paragraphs (guards the test stays meaningful)', async ({ request }) => {
    const res = await request.get(`/${DOC_FILE}`);
    expect(res.ok()).toBeTruthy();
    const md = await res.text();
    // A single newline with non-blank text on both sides = a hard-wrapped
    // paragraph in the source. If the doc is ever reflowed to one-line
    // paragraphs this test's <br> assertions would pass vacuously.
    expect(md, `${DOC_FILE} should contain at least one paragraph hard-wrapped across source lines`)
      .toMatch(/\S[^\S\n]*\n[^\S\n]*\S/);
    // No explicit two-space markdown hard breaks — so the rendered page may
    // not contain ANY <br> inside paragraphs (next test relies on this).
    expect(md, `${DOC_FILE} should contain no explicit two-space hard breaks`)
      .not.toMatch(/ {2,}\n/);
  });

  test('rendered doc contains no <br> inside paragraphs — source line breaks are soft', async ({ page }) => {
    await gotoDoc(page);

    const info = await page.evaluate(() => {
      const content = document.getElementById('content');
      const brs = content ? content.querySelectorAll('p br, li br') : [];
      // mdhtml's protectHyphenatedTokens swaps "-" for U+2011 (non-breaking
      // hyphen) in prose, so match with hyphens normalized back.
      const norm = (s: string) => s.replace(/‑/g, '-');
      const opening = content
        ? Array.from(content.querySelectorAll('p')).find((p) => norm(p.textContent || '').includes('zero-build'))
        : null;
      return {
        brCount: brs.length,
        openingFound: !!opening,
        openingBrCount: opening ? opening.querySelectorAll('br').length : -1,
        openingText: opening ? (opening.textContent || '').slice(0, 120) : ''
      };
    });

    expect(info.openingFound, 'expected the V3-GUIDE opening paragraph ("zero-build...") to be rendered').toBe(true);
    expect(info.openingBrCount, `opening paragraph must be one flowing text block, got <br>s in: "${info.openingText}"`).toBe(0);
    expect(info.brCount, 'no paragraph/list item may contain a <br> born from a source line wrap').toBe(0);
  });

  test('opening paragraph reflows with container width (no fixed break positions)', async ({ page }) => {
    // The same paragraph must occupy a different number of visual lines at
    // different container widths — proof the breaks come from layout, not
    // from hard <br>/newline artifacts frozen at source-wrap positions.
    async function visualLines(width: number): Promise<number> {
      await page.setViewportSize({ width, height: 900 });
      await gotoDoc(page);
      return page.evaluate(() => {
        // U+2011 normalization — see previous test.
        const p = Array.from(document.querySelectorAll('#content p'))
          .find((el) => (el.textContent || '').replace(/‑/g, '-').includes('zero-build'));
        if (!p) return -1;
        const range = document.createRange();
        range.selectNodeContents(p);
        const lineTops = new Set<number>();
        for (const r of Array.from(range.getClientRects())) {
          if (r.width > 0 && r.height > 0) lineTops.add(Math.round(r.top / 5));
        }
        return lineTops.size;
      });
    }

    const wide = await visualLines(1400);
    const narrow = await visualLines(500);
    expect(wide, 'opening paragraph should render at 1400px').toBeGreaterThan(0);
    expect(narrow, 'opening paragraph should render at 500px').toBeGreaterThan(0);
    expect(narrow, 'narrower container must produce MORE visual lines — text reflows instead of honoring fixed source breaks')
      .toBeGreaterThan(wide);
  });

  test('breaks stays available as an explicit opt-in ({ breaks: true } / breaks="true")', async ({ page }) => {
    await page.goto('/public/doc-viewer.html', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const { mdhtml } = await import('/src/wb-viewmodels/mdhtml.js');
      const source = 'alpha beta\ngamma delta';

      const soft = document.createElement('div');
      soft.textContent = source;
      document.body.appendChild(soft);
      await mdhtml(soft, {});

      const hard = document.createElement('div');
      hard.textContent = source;
      hard.setAttribute('breaks', 'true');
      document.body.appendChild(hard);
      await mdhtml(hard, {});

      return {
        softBrCount: soft.querySelectorAll('br').length,
        hardBrCount: hard.querySelectorAll('br').length
      };
    });

    expect(result.softBrCount, 'default: a single source newline is soft — no <br>').toBe(0);
    expect(result.hardBrCount, 'breaks="true": a single source newline becomes a hard <br>').toBe(1);
  });
});
