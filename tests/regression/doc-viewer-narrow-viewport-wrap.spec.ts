import { test, expect } from '../fixtures/offline';

/**
 * #295: rendered .md docs (via public/doc-viewer.html) must wrap text
 * fluently at narrow widths -- no horizontal page scroll, ever.
 *
 * Two specific defects reported:
 *  1. Text/tables overflow into a horizontal scrollbar instead of wrapping
 *     at narrow viewports (375px mobile named specifically).
 *  2. Hyphenated tokens break mid-word at the hyphen (e.g. `x-toast` renders
 *     as `x-` then `toast` on the next line) -- words with hyphens must stay
 *     whole. Also: when a long attribute wraps to a new line inside a code
 *     sample, the continuation should be indented (hanging indent), not
 *     flush-left.
 *
 * docs/V3-GUIDE.md is used as the primary target: it has prose, a
 * comparison table (`| You write | What happens |`), and a fenced code
 * sample -- and it's the doc where the hyphenated token in the issue
 * (`x-toast`) actually appears, both as inline `code` in a table cell and
 * as bare text inside a code sample.
 */

const DOC_URL = '/public/doc-viewer.html?file=docs/V3-GUIDE.md';

async function gotoDocAtNarrowWidth(page) {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = (document.getElementById('content')?.innerText || '');
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });
  // Let syntax highlighting / linkify / rebasing settle (all run in the
  // wb:mdhtml:loaded handler, async, after the content text is already in).
  // A fixed 300ms read the page mid-render: mdhtml.css is JIT-loaded (#342),
  // so for a moment every fenced <pre> had no `overflow-x: auto` yet and its
  // <code> measured as leaking past the viewport (7 "offenders", all bare
  // code-in-pre, all contained once the stylesheet landed). Highlighting is
  // the LAST step of that handler, so every block carrying .hljs means the
  // render -- and the behavior CSS it pulled in -- has finished.
  await page.waitForFunction(() => {
    const blocks = Array.from(document.querySelectorAll('#content pre code'));
    return blocks.length > 0 && blocks.every((b) => b.classList.contains('hljs'));
  }, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  // Live examples in the doc (a card, a demo) are built lazily as they near
  // the viewport. Measured before that, an x-card--md read as unbuilt and
  // passed here, while loaded Windows CI caught it built: 360px wide in a
  // 321px column, 12px past the screen edge. Scroll the whole document
  // through, then wait for every example host to have finished building.
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await frame();
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#content [class*="x-card--"], #content [x-demo]'))
    .every((el) => el.hasAttribute('x-ready')), undefined, { timeout: 15000 });
}

test.describe('doc-viewer: narrow-viewport wrap (#295)', () => {
  test('no horizontal page scroll at 375px', async ({ page }) => {
    await gotoDocAtNarrowWidth(page);

    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(overflow, 'document should not scroll horizontally at 375px').toBeLessThanOrEqual(2);
  });

  test('no element wider than the viewport at 375px (unless self-contained in its own scrollable box)', async ({ page }) => {
    await gotoDocAtNarrowWidth(page);

    // A table (or a code block) is explicitly allowed to be logically wider
    // than the viewport -- mdhtml.css deliberately gives wide tables their
    // OWN scrollable wrapper (.x-mdhtml__table-wrap) rather than forcing
    // columns to squeeze illegibly (§ the issue's "tables either wrap their
    // cell content or scroll within their own bounded container" fix note).
    // What must never happen is that overflow LEAKING past the page edge --
    // i.e. any element wider than the viewport that does NOT have a
    // scrollable ancestor containing it is a real bug.
    const offenders = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      function hasScrollableAncestor(el: Element) {
        let p: Element | null = el.parentElement;
        while (p) {
          const cs = getComputedStyle(p);
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
          p = p.parentElement;
        }
        return false;
      }
      const els = Array.from(document.querySelectorAll('#content *'));
      return els
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), width: r.width, right: r.right, contained: hasScrollableAncestor(el) };
        })
        // A tiny tolerance for sub-pixel rounding.
        .filter((r) => (r.width > vw + 2 || r.right > vw + 2) && !r.contained);
    });

    expect(offenders, `elements wider than the 375px viewport with no scrollable ancestor to contain them: ${JSON.stringify(offenders).slice(0, 800)}`).toEqual([]);
  });

  test('hyphenated tokens like x-toast are never split across a line break at 375px', async ({ page }) => {
    await gotoDocAtNarrowWidth(page);

    // Find every text node under #content whose text contains "x-toast"
    // (case-sensitive -- it's a code identifier), then measure the exact
    // range covering just that substring. If the token wraps mid-hyphen,
    // the range spans two visual lines and getClientRects() returns 2+
    // rects (one per visual line) instead of 1.
    const results = await page.evaluate(() => {
      const root = document.getElementById('content');
      if (!root) return [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const hits: { text: string; rects: number; parentTag: string }[] = [];
      let node: Text | null;
      // eslint-disable-next-line no-cond-assign
      while ((node = walker.nextNode() as Text | null)) {
        const value = node.nodeValue || '';
        let idx = value.indexOf('x-toast');
        while (idx !== -1) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + 'x-toast'.length);
          const rects = range.getClientRects();
          hits.push({ text: value.slice(Math.max(0, idx - 10), idx + 17), rects: rects.length, parentTag: node.parentElement ? node.parentElement.tagName : '' });
          idx = value.indexOf('x-toast', idx + 1);
        }
      }
      return hits;
    });

    expect(results.length, 'expected at least one "x-toast" occurrence in docs/V3-GUIDE.md to test against').toBeGreaterThan(0);
    for (const hit of results) {
      expect(hit.rects, `"x-toast" split across a line break (in <${hit.parentTag}>, context: "${hit.text}")`).toBe(1);
    }
  });

  test('.x-mdhtml does not allow mid-word breaks (word-break: normal, not break-word)', async ({ page }) => {
    await gotoDocAtNarrowWidth(page);

    // #448: this container is public/doc-viewer.html's own plain
    // <div id="content"> (mdhtml() is called on it directly, not on a
    // <div x-mdhtml> tag), so it still carries the `.x-mdhtml` class -- only
    // a literal <div x-mdhtml> host has that class removed in favor of the tag.
    const style = await page.evaluate(() => {
      const el = document.querySelector('.x-mdhtml');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { wordBreak: cs.wordBreak, overflowWrap: cs.overflowWrap };
    });

    expect(style, '.x-mdhtml container should exist').not.toBeNull();
    // break-word / anywhere on the CONTAINER would permit splitting at every
    // opportunity (including inside otherwise-unbreakable hyphenated
    // tokens' surrounding run); the container level must stay "normal" so
    // only real word boundaries wrap, matching the token-protection fix.
    expect(style!.wordBreak, '.x-mdhtml word-break should be "normal", not "break-word"').toBe('normal');
  });
});
