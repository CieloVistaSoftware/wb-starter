/**
 * EVERY .md DOC FITS A PHONE (#295)
 * =================================
 * #295: "Text in rendered .md docs must ALWAYS wrap when the width shrinks",
 * acceptance "375px: no horizontal page scroll on ANY .md doc".
 *
 * doc-viewer-narrow-viewport-wrap.spec.ts proves the fixes on one doc,
 * docs/V3-GUIDE.md (page overflow, element overflow, x-toast staying whole,
 * word-break). This file holds the "any doc" half: every .md under docs/,
 * found on disk at run time so a doc added tomorrow is checked too, opened
 * in the doc viewer at 375px. Each must have no horizontal page scroll and
 * no element wider than the screen unless it sits in its own scrolling box
 * (a wide table or a code block scrolls inside itself, by design).
 *
 * See it by hand: open /public/doc-viewer.html?file=<any doc> in a 375px
 * wide window and scroll sideways. Nothing moves.
 */
import fs from 'fs';
import path from 'path';
import { test, expect, type Page } from '../fixtures/offline';

/** Every .md under docs/, as repo-relative paths with forward slashes. */
function allDocs(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) out.push(full.split(path.sep).join('/'));
    }
  };
  walk('docs');
  return out.sort();
}

/**
 * Every behavior attribute the runtime knows (tag-map plus wb-lazy's
 * attribute-only list), so the sweep can wait for each live example in a doc
 * to finish building. A card measured before it builds is narrow and passes;
 * the same card built is the one a reader sees.
 */
async function behaviorAttributes(): Promise<string[]> {
  const tag = await import(new URL('../../src/core/tag-map.js', import.meta.url).href);
  let lazy: Record<string, unknown> = {};
  try {
    lazy = await import(new URL('../../src/core/wb-lazy.js', import.meta.url).href);
  } catch { /* the tag map alone still covers the elements */ }
  const names = Object.keys({
    ...((lazy as { WB_LAZY_ONLY_ATTRIBUTES?: Record<string, string> }).WB_LAZY_ONLY_ATTRIBUTES || {}),
    ...tag.extensionMap,
  });
  return names.filter((n) => /^x-[a-z][a-z0-9-]*$/.test(n));
}

const DOCS = allDocs();
const PER_TEST = 5;
const BATCHES: string[][] = [];
for (let i = 0; i < DOCS.length; i += PER_TEST) BATCHES.push(DOCS.slice(i, i + PER_TEST));

/** Open one doc at 375px and wait until it has finished rendering. */
async function openAtPhoneWidth(page: Page, doc: string, attrs: string[]): Promise<void> {
  await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(doc)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = document.getElementById('content')?.innerText || '';
    return t.trim().length > 0 && !t.includes('Loading documentation');
  }, undefined, { timeout: 15_000 });
  // Highlighting is the last step of the render; mdhtml.css loads on demand,
  // so a code block measured before it lands has no scroll box yet.
  // The largest docs (the two reference tables) hold hundreds of blocks; on a
  // loaded runner highlighting them took longer than 15s.
  await page.waitForFunction(() => [...document.querySelectorAll('#content pre code')]
    .every((b) => b.classList.contains('hljs')), undefined, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  // Live examples build as they come into view. A viewport as tall as the
  // doc puts every one of them in view at once -- no scrolling, no sleeps --
  // and the phone height comes back after. Widths, which are all this
  // measures, do not depend on the height.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 375, height: Math.min(Math.max(height, 800), 30_000) });
  // Then wait for every behavior host in the doc to report it has built.
  // One that never does (a decorator with nothing to build) does not block
  // the measurement past the timeout.
  await page.waitForFunction((names) => {
    const sel = names.map((n) => `#content [${n}]`).join(', ');
    return [...document.querySelectorAll(sel)]
      .filter((el) => !el.closest('[x-ignore]') && !el.closest('pre'))
      .every((el) => el.hasAttribute('x-ready'));
  }, attrs, { timeout: 15_000 }).catch(() => {});
  await page.setViewportSize({ width: 375, height: 800 });
}

/** What spills past the screen edge on the open doc, or [] if nothing does. */
async function spills(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const pageScroll = document.documentElement.scrollWidth - vw;
    if (pageScroll > 2) out.push(`page scrolls ${pageScroll}px sideways`);
    // Contained: inside a box that scrolls (a wide table, a code block), so
    // all of it can still be reached. Clipping does not count for content: the
    // doc viewer clips html and body sideways, and that is exactly what cut
    // the ends off long paths. The one exception is decoration with nothing
    // to read -- x-stagelight's beam swings inside its stage, which clips it.
    const content = document.getElementById('content');
    const media = 'img, video, audio, iframe, canvas, svg, input, select, textarea, button';
    const decorative = (el: Element) => !(el.textContent || '').trim() && !el.matches(media) && !el.querySelector(media);
    const scrolls = (el: Element | null): boolean => {
      const clipOk = !!el && decorative(el);
      for (let p = el?.parentElement; p && p !== document.body; p = p.parentElement) {
        const x = getComputedStyle(p).overflowX;
        if (x === 'auto' || x === 'scroll') return true;
        if (clipOk && (x === 'hidden' || x === 'clip') && content && content.contains(p) && p !== content) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('#content *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 2 && !scrolls(el)) {
        const cls = (el.getAttribute('class') || '').split(/\s+/)[0];
        out.push(`<${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}> ends at ${Math.round(r.right)}px: "${(el.textContent || '').trim().slice(0, 40)}"`);
        if (out.length > 5) break;
      }
    }
    return out;
  });
}

test.describe('every .md doc fits a 375px screen (#295)', () => {
  test('docs/ holds the docs this sweep is meant to cover', () => {
    expect(DOCS.length, 'no .md found under docs/ -- the walk is broken').toBeGreaterThan(100);
  });

  BATCHES.forEach((batch, i) => {
    test(`docs ${i * PER_TEST + 1}-${i * PER_TEST + batch.length} of ${DOCS.length} have no sideways scroll at 375px`, async ({ page }) => {
      // Up to five docs, each allowed 15s to render and 15s to build its examples.
      test.setTimeout(240_000);
      const attrs = await behaviorAttributes();
      await page.setViewportSize({ width: 375, height: 800 });
      const failures: string[] = [];
      for (const doc of batch) {
        await openAtPhoneWidth(page, doc, attrs);
        // A behavior can finish upgrading after the scroll-through (x-scrollable
        // gives its box a scroll only once it runs). A spill that is still
        // there after 5 seconds is real.
        let found: string[] = [];
        await expect.poll(async () => (found = await spills(page)), { timeout: 5_000 }).toEqual([]).catch(() => {});
        if (found.length) failures.push(`${doc}: ${found.join('; ')}`);
      }
      expect(failures, 'docs that spill past a 375px screen').toEqual([]);
    });
  });
});
