import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §2 and §13, enforced project-wide
 * across demos/**\/*.html and pages/**\/*.html (the doc's own stated scope,
 * "These rules apply to EVERY demo... and EVERY Markdown document").
 *
 * §2 "One code sample per rendered element (strict 1:1)": a <wb-demo> must
 * not bundle several DIFFERENTLY-CONFIGURED instances of the same component
 * under one shared code sample (the "permutation matrix" anti-pattern
 * already fixed elsewhere this session for cards.html/cards-permutation-
 * matrix.html). §17 is the one exception: a single logical GROUP sharing a
 * `name` attribute (e.g. radio buttons) counts as one unit.
 *
 * §13 "Every example has proper margins & padding": >=1rem padding inside
 * a <wb-demo>'s own container, and >=1rem gap between sibling rendered
 * items within one <wb-demo> grid. Confirmed live via screenshot
 * (demos/site/overlays.html): dialog/drawer/dropdown trigger pills sat
 * with almost no visible gap between them.
 */

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

const MIN_GAP_PX = 15; // ~1rem at the default 16px root, with a little slack for rounding
const MIN_PADDING_PX = 15;

function parseWbDemoBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<wb-demo\b[^>]*>([\s\S]*?)<\/wb-demo>/g;
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
    test(`${file}: no permutation-matrix <wb-demo> blocks (§2)`, async () => {
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
            `<wb-demo> block has ${children.length} differently-configured <${children[0].tag}> children sharing one code sample: ${[...distinctAttrSets].join(' | ')}`
          );
        }
      }

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Demo layout standards (§13) — live spacing', () => {
  for (const file of FILES) {
    test(`${file}: wb-demo containers/items have >=1rem spacing (§13)`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      const demos = page.locator('wb-demo');
      const count = await demos.count();
      if (count === 0) test.skip(true, 'no <wb-demo> blocks on this page');

      await page.waitForTimeout(800); // settle lazy/eager scan + grid build

      const violations = await page.evaluate((minGap) => {
        const problems: string[] = [];
        document.querySelectorAll('wb-demo').forEach((demo, i) => {
          const cs = getComputedStyle(demo);
          const padTop = parseFloat(cs.paddingTop) || 0;
          const grid = demo.querySelector('.wb-demo__grid');
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
                  problems.push(`wb-demo[${i}]: item spacing ${realGap.toFixed(1)}px < ${minGap}px`);
                }
              }
            }
          }
          if (padTop < minGap) {
            problems.push(`wb-demo[${i}]: own padding-top ${padTop}px < ${minGap}px`);
          }
        });
        return problems;
      }, MIN_GAP_PX);

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
