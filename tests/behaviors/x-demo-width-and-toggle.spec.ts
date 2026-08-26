/**
 * Standard §7 (default / desktop): a single-item demo — the rendered
 * control AND its code panel below, as ONE unit — hugs its own content
 * width. <div x-demo> always built its grid at the configured/default column
 * count (3) regardless of how many children it actually had, stretching
 * the whole demo to fill 3 columns' worth of width. Fixed in
 * src/wb-viewmodels/demo.js (clamp columns to actual child count) +
 * src/styles/behaviors/demo.css (size a resulting single-column demo to
 * its content).
 *
 * Standard §26 (#390), MOBILE ONLY (<=700px): splits the two apart — the
 * control still hugs its content (§7), but `[x-demo]` itself and its code
 * panel stay full width, so scrolling past many single-item demos on a
 * long mobile page doesn't jitter the page's horizontal footprint ("window
 * slop"). NOT applied above 700px: an earlier version of this fix applied
 * unconditionally at every viewport, which orphaned a small control in a
 * wide empty gap on desktop with a code panel a full page-width wider
 * directly below it — worse than the problem being fixed. Caught in code
 * review (#390) and scoped to mobile only in demo.css.
 *
 * Separately, pre.js's "hide code" toggle rendered unconditionally on
 * every code sample, including every <div x-demo>-generated one (never sets
 * max-height, so there's nothing meaningful to collapse). Fixed in
 * src/wb-viewmodels/semantics/pre.js: gated behind config.maxHeight.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string, containerWidth = 1000): Promise<void> {
  await page.goto('/demos/test-harness.html');
  // test-harness.html (see the file itself) is a minimal WB.init() page with
  // no SPA shell -- it never defines window.WBSite, so waiting on
  // WBSite.currentPage here always timed out. WB.behaviors is the real
  // ready-signal this harness provides.
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate(({ h, w }: { h: string; w: number }) => {
    const c = document.createElement('div');
    c.id = 'x-demo-width-test-area';
    c.style.cssText = `width: ${w}px;`;
    c.innerHTML = h;
    document.body.appendChild(c);
  }, { h: html, w: containerWidth });
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(500);
}

test.describe('single-item <div x-demo> hugs its content width (desktop, Standard §7)', () => {
  test('a single child gets clamped to cols-1, not the default 3', async ({ page }) => {
    await setup(page, '<div x-demo id="d1"><button>Solo</button></div>');
    const grid = page.locator('#d1 .x-demo__grid');
    await expect(grid).toHaveClass(/x-demo__grid--cols-1/);
  });

  test('the whole demo (including its code panel) is narrower than the 1000px container', async ({ page }) => {
    await setup(page, '<div x-demo id="d2"><button>Solo</button></div>');
    const width = await page.locator('#d2').evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThan(900); // well short of the 1000px container — hugs its content as one unit
  });

  test('multiple children still fill the configured column count (unaffected)', async ({ page }) => {
    await setup(page, '<div x-demo id="d3" columns="3"><button>One</button><button>Two</button><button>Three</button></div>');
    const grid = page.locator('#d3 .x-demo__grid');
    await expect(grid).toHaveClass(/x-demo__grid--cols-3/);
  });
});

test.describe('<div x-demo> code panel is full width on mobile only — no window slop (Standard §26, #390)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the grid still hugs its single child, but [x-demo]/code panel stay full width', async ({ page }) => {
    await setup(page, '<div x-demo id="d2m"><button>Solo</button></div>', 375);
    const demoWidth = await page.locator('#d2m').evaluate((el) => el.getBoundingClientRect().width);
    const gridWidth = await page.locator('#d2m .x-demo__grid').evaluate((el) => el.getBoundingClientRect().width);
    expect(gridWidth).toBeLessThan(200); // control still hugs its content (§7 still applies to the control)
    expect(demoWidth).toBeGreaterThan(300); // x-demo itself is NOT shrunk along with the grid at mobile widths
  });

  test('the code panel spans [x-demo]\'s own content width, not the narrow grid above it', async ({ page }) => {
    await setup(page, '<div x-demo id="d6"><button>Solo</button></div>', 375);
    // .x-demo__code is a direct child of x-demo, inside its 1rem padding --
    // it fills x-demo's CONTENT box (demoWidth minus that padding on both
    // sides), not demoWidth itself. Compare against the content width, not
    // the outer box, so this doesn't false-fail on [x-demo]'s own §13 padding.
    const { demoWidth, codeWidth, paddingLeft, paddingRight } = await page.locator('#d6').evaluate((el) => {
      const code = el.querySelector('.x-demo__code') as HTMLElement;
      const cs = getComputedStyle(el);
      return {
        demoWidth: el.getBoundingClientRect().width,
        codeWidth: code.getBoundingClientRect().width,
        paddingLeft: parseFloat(cs.paddingLeft),
        paddingRight: parseFloat(cs.paddingRight),
      };
    });
    const demoContentWidth = demoWidth - paddingLeft - paddingRight;
    expect(Math.abs(codeWidth - demoContentWidth)).toBeLessThan(5); // code panel tracks x-demo's content box, not the shrunk grid
  });

  test('a narrow single-item demo and a wide multi-item demo have the same [x-demo] footprint', async ({ page }) => {
    await setup(page, `
      <div x-demo id="d7"><button>Solo</button></div>
      <div x-demo id="d8" columns="3"><button>One</button><button>Two</button><button>Three</button></div>
    `, 375);
    const narrowWidth = await page.locator('#d7').evaluate((el) => el.getBoundingClientRect().width);
    const wideWidth = await page.locator('#d8').evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.abs(narrowWidth - wideWidth)).toBeLessThan(5); // no page-width jump scrolling between them
  });
});

test.describe('<div x-demo> single-item shrink stays scoped to mobile — desktop unaffected (Standard §26 boundary, #390)', () => {
  test('at desktop width, a narrow single-item demo and a wide multi-item demo do NOT share a footprint', async ({ page }) => {
    await setup(page, `
      <div x-demo id="w7"><button>Solo</button></div>
      <div x-demo id="w8" columns="3"><button>One</button><button>Two</button><button>Three</button></div>
    `);
    const narrowWidth = await page.locator('#w7').evaluate((el) => el.getBoundingClientRect().width);
    const wideWidth = await page.locator('#w8').evaluate((el) => el.getBoundingClientRect().width);
    // §7 (desktop): the narrow demo hugs its single <button>, the wide demo
    // fills its 3-column grid — the two are NOT expected to match here.
    // (#390 code review: the earlier unscoped fix wrongly forced these to
    // match at every viewport, orphaning the narrow control in empty space.)
    expect(wideWidth - narrowWidth).toBeGreaterThan(200);
  });
});

test.describe('<div x-demo> single-item shrink works for stretchy content, not just plain elements (#390)', () => {
  // A synthetic `display:flex` mock (with or without an explicit width) hit
  // a CSS grid intrinsic-sizing edge case that a real <article> apparently
  // doesn't -- confirmed live (manual repro) that a real <div x-cardimage>
  // shrinks correctly, but the isolated mock in this test harness kept
  // computing a wide grid regardless. Rather than fight a mock that
  // doesn't actually represent the real component, test the real thing:
  // <article class="x-card--auto"> (card.js's actual "no constraints,
  // fills container" size variant, card.css).
  test('a real <article class="x-card--auto"> still hugs its content, not the grid track', async ({ page }) => {
    await setup(page, `
      <div x-demo id="d9"><article title="Card" class="x-card--auto">Short content.</article></div>
    `);
    await page.waitForFunction(() => {
      const card = document.querySelector('#d9 .x-card');
      return !!card && card.classList.contains('x-card');
    }, { timeout: 5000 });
    const gridWidth = await page.locator('#d9 .x-demo__grid').evaluate((el) => el.getBoundingClientRect().width);
    expect(gridWidth).toBeLessThan(500); // hugs the card's own content, not the 1000px container
  });
});

test.describe('<div x-demo full-width> stretches its item — not just its own box (#390)', () => {
  // Regression: adding `justify-items: start` (previous describe block, so a
  // shrink-to-content grid doesn't stretch a no-width child) had a side
  // effect on the OPPOSITE case -- a `full-width` demo (e.g. a page hero)
  // whose grid became wide via the escape hatch, but whose lone child no
  // longer stretched to fill it. Confirmed live: <div x-cardhero> inside a
  // full-width demo collapsed to a ~40px sliver of clipped text on a
  // Samsung Galaxy A51 viewport (412px) instead of spanning the page.
  test('a full-width demo\'s single child spans the grid, not just its own content width', async ({ page }) => {
    await setup(page, `
      <div x-demo id="d12" full-width><div style="display:flex;height:60px;background:#333">hero-shaped</div></div>
    `);
    const gridWidth = await page.locator('#d12 .x-demo__grid').evaluate((el) => el.getBoundingClientRect().width);
    const childWidth = await page.locator('#d12 .x-demo__grid > div').evaluate((el) => el.getBoundingClientRect().width);
    expect(gridWidth).toBeGreaterThan(900); // the container itself is full-width
    expect(Math.abs(childWidth - gridWidth)).toBeLessThan(5); // and the child actually fills it
  });

  test('a full-width demo\'s single child spans the grid on mobile too', async ({ page }) => {
    await setup(page, `
      <div x-demo id="d13" full-width><div style="display:flex;height:60px;background:#333">hero-shaped</div></div>
    `, 375);
    const gridWidth = await page.locator('#d13 .x-demo__grid').evaluate((el) => el.getBoundingClientRect().width);
    const childWidth = await page.locator('#d13 .x-demo__grid > div').evaluate((el) => el.getBoundingClientRect().width);
    expect(gridWidth).toBeGreaterThan(300);
    expect(Math.abs(childWidth - gridWidth)).toBeLessThan(5);
  });
});

test.describe('<div x-demo> code panel uses horizontal scroll, not wrap (#390, explicit override of Standard §6)', () => {
  test('the generated code panel has no wrap modifier — white-space: pre, overflow-x: auto', async ({ page }) => {
    await setup(page, '<div x-demo id="d10"><button>Solo</button></div>');
    const code = page.locator('#d10 .x-demo__code');
    await expect(code).not.toHaveClass(/x-pre--wrap/);
    const styles = await code.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { whiteSpace: cs.whiteSpace, overflowX: cs.overflowX };
    });
    expect(styles.whiteSpace).toBe('pre');
    expect(styles.overflowX).toBe('auto');
  });

  test('a long attribute line scrolls horizontally instead of wrapping to a second line', async ({ page }) => {
    await setup(page, `
      <div x-demo id="d11"><a href="https://example.com/a/very/long/path/that/does/not/wrap/at/all/on/purpose/for/this/test">Link</a></div>
    `, 300);
    const code = page.locator('#d11 .x-demo__code');
    const overflow = await code.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(true); // content is wider than the box — proves it's scrolling, not wrapping
  });
});

test.describe('<div x-demo> code panel has no "hide code" toggle (no max-height set)', () => {
  test('no .x-pre__toggle button renders on a generated code sample', async ({ page }) => {
    await setup(page, '<div x-demo id="d4"><button>Solo</button></div>');
    await expect(page.locator('#d4 .x-pre__toggle')).toHaveCount(0);
  });

  test('the copy button still renders (only the toggle was gated)', async ({ page }) => {
    await setup(page, '<div x-demo id="d5"><button>Solo</button></div>');
    await expect(page.locator('#d5 .x-pre__copy')).toHaveCount(1);
  });

  test('a pre with an explicit max-height still gets the toggle', async ({ page }) => {
    await setup(page, '<pre id="p1" x-behavior="pre" max-height="100px"><code>line1\nline2\nline3</code></pre>');
    await expect(page.locator('#p1').locator('xpath=..').locator('.x-pre__toggle')).toHaveCount(1);
  });
});
