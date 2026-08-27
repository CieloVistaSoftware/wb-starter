import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §2 and §13, enforced project-wide
 * across demos/**\/*.html and pages/**\/*.html (the doc's own stated scope,
 * "These rules apply to EVERY demo... and EVERY Markdown document").
 *
 * §2 "One code sample per rendered element (strict 1:1)": a <div x-demo> must
 * not bundle several DIFFERENTLY-CONFIGURED instances of the same behavior
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

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

const MIN_GAP_PX = 15; // ~1rem at the default 16px root, with a little slack for rounding
const MIN_PADDING_PX = 15;
const MIN_TEXT_EDGE_PX = 16; // 1rem — matches DEMOS-AND-DOCS-STANDARDS.md §13's documented minimum

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
    test(`${file}: x-demo containers/items have >=1rem spacing (§13)`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      const demos = page.locator('x-demo');
      const count = await demos.count();
      if (count === 0) test.skip(true, 'no <div x-demo> blocks on this page');

      await page.waitForTimeout(800); // settle lazy/eager scan + grid build

      const violations = await page.evaluate((minGap) => {
        const problems: string[] = [];
        document.querySelectorAll('x-demo').forEach((demo, i) => {
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
                  problems.push(`x-demo[${i}]: item spacing ${realGap.toFixed(1)}px < ${minGap}px`);
                }
              }
            }
          }
          if (padTop < minGap) {
            problems.push(`x-demo[${i}]: own padding-top ${padTop}px < ${minGap}px`);
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
    test(`${file}: single-item x-demo blocks shrink to fit their content`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      const demos = page.locator('x-demo');
      if ((await demos.count()) === 0) test.skip(true, 'no <div x-demo> blocks on this page');

      await page.waitForTimeout(800); // settle lazy/eager scan + grid build

      const violations = await page.evaluate(() => {
        const problems: string[] = [];
        const TOLERANCE_PX = 24; // padding rounding + border slack
        document.querySelectorAll('x-demo').forEach((demo, i) => {
          // #563 follow-up: `full-width` is a deliberate, documented escape
          // hatch (demo.css's `x-demo.x-demo--full-width`) for behaviors
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
          // in an intermediate `.x-pre-wrapper` div, so it's a GRANDCHILD of
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
  // atoms not explicitly listed here.
  const MIN_PANEL_WIDTH = 120;
  const MIN_PANEL_HEIGHT = 32;

  for (const file of FILES) {
    test(`${file}: content-panel elements keep >=1rem text padding`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const violations = await page.evaluate(({ minPad, minW, minH }) => {
        const problems: string[] = [];
        const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[];

        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width < minW || rect.height < minH) continue; // a UI atom, not a content panel
          // #561: the SIZE-based atom exclusion above (width/height < 120px)
          // doesn't catch x-portfolio__avatar-placeholder (card.js's
          // initials-fallback avatar circle) -- its default diameter is
          // exactly 7.5rem/120px, and its lg/xl/full size variants exceed
          // it, so this check treated it as a full content panel needing
          // 1rem padding. But this element centers its initials via
          // `display:flex; align-items:center; justify-content:center`, not
          // via padding -- the real gap from "JS"/"SC" to the circle's edge
          // is (diameter - content size) / 2, generous regardless of the
          // padding value the CSS declares. A circular, flex-centered
          // element is never "crowding" text the way a padding check can
          // detect, at any size, so exclude by SHAPE here as a second,
          // independent test -- the describe block's own intro comment
          // already lists "avatars" among the intentionally-excluded
          // compact atoms; this just makes that exclusion match the actual
          // centering mechanism instead of only a width/height heuristic
          // that happens to miss this element at its default size.
          const shapeCs = getComputedStyle(el);
          // Chromium's computed `border-*-radius` stays a PERCENTAGE string
          // (e.g. "50%") rather than resolving to px, even though the USED
          // value is resolved against the box -- so this must compare
          // against the declared percentage (>=50 == fully round), never
          // against rect.width/2 in px (a px comparison silently fails for
          // every avatar, since parseFloat("50%") is 50 regardless of the
          // element's actual size).
          const isFullyRound = (side: string) => {
            const v = (shapeCs as any)[`border${side}Radius`] as string;
            return v.trim().endsWith('%') && parseFloat(v) >= 50;
          };
          const isCircular = isFullyRound('TopLeft') && isFullyRound('TopRight')
            && isFullyRound('BottomLeft') && isFullyRound('BottomRight');
          const isFlexCentered = shapeCs.display === 'flex'
            && shapeCs.alignItems === 'center'
            && shapeCs.justifyContent === 'center';
          if (isCircular && isFlexCentered) continue;
          // Must have direct, non-whitespace text of its own (not just via
          // nested elements) -- otherwise the padding requirement belongs to
          // whichever descendant actually renders text.
          const hasOwnText = Array.from(el.childNodes).some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
          );
          if (!hasOwnText) continue;

          const cs = getComputedStyle(el);
          const parent = el.parentElement ? getComputedStyle(el.parentElement) : null;
          // #447: a single-side border (e.g. a heading's border-bottom
          // underline/divider) isn't an enclosing "panel" -- it doesn't
          // crowd the text against edges the way a real bordered box does.
          // Require all four sides so a genuine panel (a card, a bordered
          // box) is still caught, but a plain underlined heading isn't
          // (confirmed live: demos/autoinject.html's "Zero-Config Form" h2
          // has only a border-bottom divider, flagged as a false positive).
          const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].every(
            (side) => parseFloat((cs as any)[`border${side}Width`]) > 0 && cs[`border${side}Style` as any] !== 'none'
          );
          const bg = cs.backgroundColor;
          const isTransparent = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
          const hasDistinctBg = !isTransparent && (!parent || parent.backgroundColor !== bg);
          if (!hasBorder && !hasDistinctBg) continue; // not a "panel" -- no visible edge to crowd

          const pads = [
            parseFloat(cs.paddingTop),
            parseFloat(cs.paddingRight),
            parseFloat(cs.paddingBottom),
            parseFloat(cs.paddingLeft),
          ];
          const minSide = Math.min(...pads);
          if (minSide < minPad) {
            const label = (el.textContent || '').trim().slice(0, 40);
            problems.push(
              `<${el.tagName.toLowerCase()} class="${el.className}"> "${label}" has ${minSide}px padding on its tightest side < ${minPad}px`
            );
          }
        }
        return problems;
      }, { minPad: MIN_TEXT_EDGE_PX, minW: MIN_PANEL_WIDTH, minH: MIN_PANEL_HEIGHT });

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
