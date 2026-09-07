import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #986 / #985 — code must paint already coloured, and already the right width.
 *
 * John: "when code is showing now, it takes forever for it to become colored —
 * it should render colored." And, of the same page: "on many of our code
 * examples that element slowly expands little by little."
 *
 * Measured before the fix, on a cold load of demos/site/layout.html:
 *
 *   code paints as plain text        234ms
 *   .hljs-* spans arrive             741ms   <- 507ms of unstyled monospace
 *   first width step                 768ms   <- 27ms later, and 983 resize
 *                                               events at ~2px apiece over 44
 *                                               panels
 *
 * ONE ordering bug, both symptoms: injecting the highlight spans changed the
 * content width the shrink-to-fit poll was measuring, so the panel visibly grew
 * as it coloured.
 *
 * The fix (4278fcf7) appends the <pre> with `visibility: hidden` and reveals it
 * only after the scan that applies the `code` behavior — so the FIRST painted
 * frame is coloured and correctly sized.
 *
 * WHAT THIS FILE CAN AND CANNOT PROVE, established by fault injection rather
 * than assumed: the transient flash itself is NOT observable from inside the
 * page (see the removed test below). What is observable, and is asserted here,
 * is the end state — every visible panel is highlighted — and the ORDERING in
 * demo.js that produces it. Comment out `pre.style.visibility = 'hidden'` and
 * the ordering assertion fails, which is what makes it worth having.
 */

const PAGE = '/demos/site/layout.html';
const DEMO_SRC = 'src/wb-viewmodels/demo.js';

test.describe('#986: code is coloured on its first painted frame', () => {
  // REMOVED: 'no code panel is ever visible without highlighting'.
  //
  // It used addInitScript to install a MutationObserver before any page script
  // ran, and recorded any <pre> that appeared visible while still plain text.
  // It passed — and FAULT INJECTION proved it passed for no reason: commenting
  // out `pre.style.visibility = 'hidden'` in demo.js, which is the entire
  // mechanism under test, still gave 3 of 3 green.
  //
  // The flaw is structural, not a tuning problem. MutationObserver callbacks are
  // ASYNCHRONOUS: by the time the callback runs, the scan has already applied
  // highlighting, so the callback reads post-hoc state and calls it
  // insertion-time state. There is no snapshot of the moment a node was added,
  // so this cannot detect the transient flash from inside the page at all.
  //
  // Deleted rather than left green. A test that cannot fail reports success for
  // something it never checked (#870), and one that survives having its own
  // subject removed is worse than no test: it actively certifies the defect.
  //
  // What WOULD catch it is a paint-level measurement rather than a DOM one — a
  // trace or screenshot of the first frames. Left undone deliberately rather
  // than faked. The two assertions below hold real properties.

  test('every rendered code panel ends up highlighted', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB);
    await page.waitForSelector('pre', { state: 'attached' });

    const bare = await page.waitForFunction(() => {
      const pres = [...document.querySelectorAll('pre')].filter(
        (p) => (p.textContent || '').trim() && getComputedStyle(p).visibility !== 'hidden',
      );
      if (!pres.length) return null;
      const unhighlighted = pres.filter(
        (p) => !p.querySelector('[class*="hljs-"]') && !p.classList.contains('hljs'),
      );
      return unhighlighted.length === 0 ? [] : null;
    }, undefined, { timeout: 15000 }).then(() => [] as string[]).catch(async () =>
      page.evaluate(() =>
        [...document.querySelectorAll('pre')]
          .filter((p) => (p.textContent || '').trim() && getComputedStyle(p).visibility !== 'hidden')
          .filter((p) => !p.querySelector('[class*="hljs-"]') && !p.classList.contains('hljs'))
          .map((p) => (p.className || 'pre') + ' :: ' + (p.textContent || '').trim().slice(0, 50)),
      ),
    );

    expect(
      bare,
      `visible code panels never received highlighting:\n  ${bare.slice(0, 8).join('\n  ')}`,
    ).toEqual([]);
  });
});

test.describe('#986: the ordering that makes it possible is still in place', () => {
  /**
   * Comments are BLANKED before scanning, newlines preserved.
   *
   * Without this the scan cannot tell code from a comment ABOUT the code: a
   * fault probe that commented the line out was still "found", so the test
   * passed while the mechanism it guards was disabled. Exactly the defect fixed
   * in tests-must-assert.spec.ts earlier the same day.
   */
  const NL = String.fromCharCode(10);
  const blank = (text: string) => text.split(NL).map((l) => ' '.repeat(l.length)).join(NL);
  const stripComments = (src: string) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .split(NL)
      .map((line) => line.replace(/(^|[^:])\/\/.*$/, (m, p1) => p1))
      .join(NL);

  test('the panel is hidden until it has been scanned, then revealed', () => {
    const src = stripComments(readFileSync(DEMO_SRC, 'utf8'));
    const hideAt = src.indexOf("pre.style.visibility = 'hidden'");
    const appendAt = src.indexOf('element.appendChild(pre)');

    expect(
      hideAt,
      `${DEMO_SRC} no longer hides the panel before appending it. Without that, the panel paints\n` +
      'as plain monospace and then visibly colours and resizes — #986 and #985 together.',
    ).toBeGreaterThan(-1);

    expect(
      hideAt < appendAt,
      'the panel is appended BEFORE being hidden, so there is a frame in which it is visible\n' +
      'and unhighlighted — which is the whole defect.',
    ).toBe(true);

    // visibility, deliberately, not display: the box must still lay out so its
    // width can be measured while hidden.
    expect(
      /pre\.style\.visibility\s*=\s*'hidden'/.test(src) && !/pre\.style\.display\s*=\s*'none'/.test(src),
      'the panel is hidden with display:none rather than visibility:hidden, so it does not lay\n' +
      'out and cannot be measured while hidden — which reintroduces the width snap.',
    ).toBe(true);
  });
});
