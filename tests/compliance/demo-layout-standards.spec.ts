import { test, expect, type Page } from '../fixtures/offline';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import { traceNavigations } from '../helpers/navigation-trace';
import { wbIdle } from '../base';
import { panelPaddingViolations, MIN_TEXT_EDGE_PX, MIN_PANEL_WIDTH, MIN_PANEL_HEIGHT } from '../../scripts/lib/layout-checks.mjs';

// #1311: a failure here prints every main-frame navigation the page made.
traceNavigations(test);

/**
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §2 and §13, enforced project-wide
 * across demos/**\/*.html and pages/**\/*.html (the doc's own stated scope,
 * "These rules apply to EVERY demo... and EVERY Markdown document").
 *
 * §2 "One code sample per rendered element (strict 1:1)": a <div x-demo> must
 * not bundle several DIFFERENTLY-CONFIGURED instances of the same component
 * under one shared code sample (the "permutation matrix" anti-pattern
 * already fixed elsewhere this session for cards.html/cards-permutation-
 * matrix.html). §17 is the one exception: a single logical GROUP sharing a
 * `name` attribute (e.g. radio buttons) counts as one unit.
 *
 * §13 "Every example has proper margins & padding": >=1rem padding inside
 * a <div x-demo>'s own container, and >=1rem gap between sibling rendered
 * items within one <div x-demo> grid. Confirmed live via screenshot
 * (demos/site/overlays.html): dialog/drawer/dropdown trigger pills sat
 * with almost no visible gap between them.
 */

// posix: forward slashes on every OS -- the file becomes part of each test's
// NAME, and a name must be the same test on Windows and on CI.
const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd(), posix: true }),
  ...globSync('pages/**/*.html', { cwd: process.cwd(), posix: true }),
].sort();

const MIN_GAP_PX = 15; // ~1rem at the default 16px root, with a little slack for rounding
// MIN_TEXT_EDGE_PX (16, 1rem) is DEMOS-AND-DOCS-STANDARDS.md §13's documented minimum; it lives
// beside the check in scripts/lib/layout-checks.mjs.

/**
 * Read the page the way a reader does before measuring it.
 *
 * The lazy runtime (#491) builds an element only as it nears the viewport, so
 * a check that measures right after load only ever sees the first screen
 * built -- everything below the fold is still raw markup, carrying none of the
 * padding, backgrounds or grids its behavior will give it. That is how
 * demos/autoinject.html's decorator table (cells under a distinct header
 * background) stayed invisible to the content-panel check: it is built only
 * once it is scrolled near. Scroll through once, back to the top, then wait
 * for every finite CSS transition/animation to finish (#1165,
 * tests/helpers/settled-style.ts) -- cards carry `transition: all`, and a
 * padding read mid-transition reports the STARTING value, a failure that
 * appears only under load.
 */
/**
 * #1064: wait for the runtime to say every injection has finished, instead of
 * a fixed 800ms. A page that does not load WB has nothing to wait for.
 */
async function settled(page: Page): Promise<void> {
  // A page can navigate once while it boots (the #1108 service-worker release
  // reloads a page it found controlled); the wait then dies with "Execution
  // context was destroyed" (#1681 CI, landing-page-showcase.html). Wait for
  // the page that replaced it and settle that one. Any other error throws.
  for (let attempt = 0; ; attempt++) {
    try {
      const hasRuntime = await page.evaluate(() => typeof (window as any).WB?.settled === 'function');
      if (hasRuntime) await wbIdle(page);
      return;
    } catch (err) {
      if (attempt > 0 || !/Execution context was destroyed/.test(String(err))) throw err;
      await page.waitForLoadState('load');
    }
  }
}

async function readThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    // wb-lazy.js observes with rootMargin 1200px: a viewport at scrollY
    // builds everything from scrollY-1200 to scrollY+innerHeight+1200, so a
    // step of innerHeight+2000 still overlaps and skips nothing -- and keeps
    // demos/site/cards.html (~160,000px tall) inside the test timeout.
    const step = window.innerHeight + 2000;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await frame();
      await frame();
    }
    window.scrollTo(0, 0);
    await frame();
    await frame();
  });
  // Building is asynchronous (a behavior's module and stylesheet load on
  // first use). waitForLoadState('networkidle') resolves at once here -- the
  // page already reached it before the scroll -- so watch the resource
  // timeline instead: measure once it has stopped growing for 500ms.
  await page.evaluate(async () => {
    const count = () => performance.getEntriesByType('resource').length;
    const deadline = Date.now() + 10_000;
    let last = -1;
    while (Date.now() < deadline && count() !== last) {
      last = count();
      await new Promise((r) => setTimeout(r, 500));
    }
  });
  // A behavior's stylesheet arrives as a <link> on first use, and the quiet
  // resource timeline above can end before it has loaded: demos/frameworks.html
  // was measured with demo.css still pending (padding-top 0) on CI (#1516).
  // A loaded <link> has a sheet; wait until every one does.
  await page.waitForFunction(
    () => [...document.querySelectorAll('link[rel="stylesheet"]')].every((l) => !!(l as HTMLLinkElement).sheet),
    null,
    { timeout: 10_000 },
  ).catch(() => {});
  await page.evaluate(async () => {
    const running = document.getAnimations().filter(
      (a) => a.effect?.getTiming().iterations !== Infinity
    );
    await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
  });
}

// Reading demos/site/cards.html through (~160,000px, several hundred cards
// built on the way down) takes longer than the default 30s on its own.
test.describe.configure({ timeout: 90_000 });

function parseWbDemoBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<div x-demo\b[^>]*>([\s\S]*?)<\/x-demo>/g;
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);
  return blocks;
}

function topLevelChildren(blockHtml: string): { tag: string; attrs: string }[] {
  // Crude but sufficient for our own authored markup: match top-level opening
  // tags only (not nested ones) by tracking depth via a simple tag stack.
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  const out: { tag: string; attrs: string }[] = [];
  let depth = 0;
  let m;
  while ((m = tagRe.exec(blockHtml))) {
    const [full, tag, attrs] = m;
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>');
    if (isClose) {
      depth--;
      continue;
    }
    if (depth === 0) out.push({ tag: tag.toLowerCase(), attrs });
    if (!isSelfClose) depth++;
  }
  return out;
}

test.describe('Demo layout standards (§2, §13) — static scan', () => {
  for (const file of FILES) {
    test(`${file}: no permutation-matrix <div x-demo> blocks (§2)`, async () => {
      const html = readFileSync(file, 'utf8');
      const blocks = parseWbDemoBlocks(html);
      const violations: string[] = [];

      for (const block of blocks) {
        const children = topLevelChildren(block);
        if (children.length < 2) continue;

        const sameTag = children.every((c) => c.tag === children[0].tag);
        if (!sameTag) continue; // mixed-tag groups aren't the permutation-matrix pattern

        const hasSharedName = children.every((c) => /\bname=/.test(c.attrs));
        if (hasSharedName) continue; // §17 grouped-control exception (e.g. radio buttons)

        const distinctAttrSets = new Set(children.map((c) => c.attrs.replace(/\s+/g, ' ').trim()));
        if (distinctAttrSets.size > 1) {
          violations.push(
            `<div x-demo> block has ${children.length} differently-configured <${children[0].tag}> children sharing one code sample: ${[...distinctAttrSets].join(' | ')}`
          );
        }
      }

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Demo layout standards (§13) — live spacing', () => {
  for (const file of FILES) {
    test(`${file}: [x-demo] containers/items have >=1rem spacing (§13)`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      const demos = page.locator('[x-demo]');
      const count = await demos.count();
      if (count === 0) test.skip(true, 'no <div x-demo> blocks on this page');

      await settled(page);
      await readThrough(page);

      const violations = await page.evaluate((minGap) => {
        const problems: string[] = [];
        document.querySelectorAll('[x-demo]').forEach((demo, i) => {
          const cs = getComputedStyle(demo);
          const padTop = parseFloat(cs.paddingTop) || 0;
          const grid = demo.querySelector('.x-demo__grid');
          if (grid) {
            const gridCs = getComputedStyle(grid);
            const gap = parseFloat(gridCs.rowGap || gridCs.gap) || 0;
            const columnGap = parseFloat(gridCs.columnGap || gridCs.gap) || 0;
            if (gap < minGap && columnGap < minGap) {
              // Fall back to measuring actual rendered gaps between the
              // first two children directly, in case gap isn't set via the
              // CSS `gap` property but via margins instead.
              const kids = Array.from(grid.children) as HTMLElement[];
              if (kids.length >= 2) {
                const a = kids[0].getBoundingClientRect();
                const b = kids[1].getBoundingClientRect();
                const horizontalGap = b.left - a.right;
                const verticalGap = b.top - a.bottom;
                const realGap = Math.max(horizontalGap, verticalGap);
                if (realGap < minGap) {
                  problems.push(`[x-demo][${i}]: item spacing ${realGap.toFixed(1)}px < ${minGap}px`);
                }
              }
            }
          }
          if (padTop < minGap) {
            problems.push(`[x-demo][${i}]: own padding-top ${padTop}px < ${minGap}px`);
          }
        });
        return problems;
      }, MIN_GAP_PX);

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Demo layout standards (§7) — single-item demos are not full width', () => {
  // A <div x-demo> holding exactly one rendered child (grid--cols-1 with a
  // single grid item) must shrink to fit that child -- not stretch to the
  // page's full content width just because it's a block-level element with
  // nothing else to fill extra grid columns. The CSS rule for this
  // (src/styles/behaviors/demo.css, `x-demo:has(> .x-demo__grid--cols-1 >
  // :only-child) { width: fit-content; }`) previously nested a `:has()`
  // inside another `:has()`'s own argument, which the CSS Selectors spec
  // disallows -- the whole selector silently failed to parse (no console
  // warning; invalid rules are just dropped), so EVERY single-item demo on
  // the entire site had been stretching to full page width. Checks that a
  // single-item demo's own width tracks its child's actual rendered width
  // (plus the demo's own padding), not the page's available content width
  // -- regardless of whether that one child happens to be narrow or wide.
  for (const file of FILES) {
    test(`${file}: single-item [x-demo] blocks shrink to fit their content`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      const demos = page.locator('[x-demo]');
      if ((await demos.count()) === 0) test.skip(true, 'no <div x-demo> blocks on this page');

      await settled(page);
      await readThrough(page);

      const violations = await page.evaluate(() => {
        const problems: string[] = [];
        const TOLERANCE_PX = 24; // padding rounding + border slack
        document.querySelectorAll('[x-demo]').forEach((demo, i) => {
          // #563 follow-up: `full-width` is a deliberate, documented escape
          // hatch (demo.css's `[x-demo].x-demo--full-width`) for components
          // that are meant to fill their container by design (page heroes,
          // banner-style alerts) -- not a bug this check should ever flag.
          if (demo.classList.contains('x-demo--full-width')) return;

          const grid = demo.querySelector(':scope > .x-demo__grid--cols-1');
          if (!grid || grid.children.length !== 1) return; // not a single-item demo
          const child = grid.children[0] as HTMLElement;

          const demoWidth = demo.getBoundingClientRect().width;
          const childWidth = child.getBoundingClientRect().width;
          const cs = getComputedStyle(demo as HTMLElement);
          const hPad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
          // #549: getBoundingClientRect() is the child's BORDER box -- it never
          // includes the child's own margin. A shrink-to-fit/fit-content
          // container has to size around a child's MARGIN box to actually
          // contain it (that's how the browser's own intrinsic-sizing
          // algorithms work), so a child with real horizontal margin (e.g. a
          // native <figure>, UA default `margin: 1em 40px`, used by the
          // Figure demos below) makes x-demo legitimately wider than
          // childWidth + padding alone -- not a stretch-to-full-width bug.
          // Confirmed live: demos/site/content.html's two <figure> image
          // demos render correctly (image at its full natural width, no
          // clipping/overflow) yet were flagged here because this check
          // didn't count the figure's own 80px margin as "needed" width.
          const childCs = getComputedStyle(child);
          const childMargin = (parseFloat(childCs.marginLeft) || 0) + (parseFloat(childCs.marginRight) || 0);
          // #563 follow-up (John: "do not cut off code... show all the
          // code"): the demo box is sized to whichever is WIDER, the control
          // or its code sample (demo.js measure()/applyNaturalWidth(),
          // Math.max(controlWidth, codeWidth)) -- a long unwrapped code line
          // legitimately needs more width than a small control, and cutting
          // it off to match the control was the exact bug John reported.
          // Count every `.x-demo__code` panel's own scrollWidth (a demo can
          // carry more than one -- an HTML sample plus a JS interaction
          // sample) as an alternate "needed width", not just the control.
          // NOT scoped to direct children (`:scope >`): a code panel with a
          // header/copy-button (pre.css's `.x-pre--has-header`) is wrapped
          // in an intermediate `.x-pre__wrapper` div, so it's a GRANDCHILD of
          // x-demo, not a direct child -- `:scope >` silently found zero
          // panels there and flagged demos/registry-browser.html's
          // correctly-sized boxes as false violations. demo.js's own
          // measure()/applyNaturalWidth() never scoped this to direct
          // children either; this now matches that exactly.
          const codeEls = demo.querySelectorAll('.x-demo__code');
          const codeWidth = codeEls.length
            ? Math.max(...Array.from(codeEls, el => (el as HTMLElement).scrollWidth))
            : 0;
          const expectedWidth = Math.max(childWidth + childMargin, codeWidth) + hPad;

          if (demoWidth > expectedWidth + TOLERANCE_PX) {
            const label = (demo.textContent || '').trim().slice(0, 40);
            problems.push(
              `x-demo[${i}] "${label}": rendered ${demoWidth.toFixed(0)}px wide but its single child + padding only needs ${expectedWidth.toFixed(0)}px -- stretched to full width instead of shrinking to fit`
            );
          }
        });
        return problems;
      });

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Layout standard: no text within 1rem of a content-panel edge', () => {
  // General anti-cramping rule (John, DEMOS-AND-DOCS-STANDARDS.md §13): any
  // element that reads as a visually bounded content PANEL (a real border,
  // or a background distinct from its own parent's) must give its own text
  // content >= 1rem of breathing room -- checked via the panel's own
  // computed padding, not DOM geometry (geometry is fragile across arbitrary
  // nesting; a panel's OWN padding is what actually controls this and is
  // what a fix would change). Confirmed live via screenshot: pages/
  // behaviors.html's "WB Behaviors Showcase" hero panel had text sitting
  // flush against its left edge.
  //
  // Deliberately excludes small, intentionally-compact interactive atoms
  // (badges, pills, kbd keys, pagination digits, tabs, avatars) -- those
  // have their own established compact padding scale by design (a
  // <span x-badge> with 1rem padding would be a visual regression, not a fix).
  // The exclusion is by SIZE (a real content panel is meaningfully larger
  // than a UI atom), not by an ad-hoc class denylist, so it generalizes to
  // atoms not explicitly listed here: MIN_PANEL_WIDTH x MIN_PANEL_HEIGHT
  // (120 x 32px, scripts/lib/layout-checks.mjs).

  for (const file of FILES) {
    test(`${file}: content-panel elements keep >=1rem text padding`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      await settled(page);
      await readThrough(page);

      // The measurement, and the reason for every exclusion it makes, is in
      // scripts/lib/layout-checks.mjs: site-migrate runs the same rule against
      // the page it proposes (#1832).
      const violations = await page.evaluate(panelPaddingViolations, { minPad: MIN_TEXT_EDGE_PX, minW: MIN_PANEL_WIDTH, minH: MIN_PANEL_HEIGHT });

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
