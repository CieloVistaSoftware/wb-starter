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

const DOCS = allDocs();
const PER_TEST = 15;
const BATCHES: string[][] = [];
for (let i = 0; i < DOCS.length; i += PER_TEST) BATCHES.push(DOCS.slice(i, i + PER_TEST));

/** Open one doc at 375px and wait until it has finished rendering. */
async function openAtPhoneWidth(page: Page, doc: string): Promise<void> {
  await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(doc)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = document.getElementById('content')?.innerText || '';
    return t.trim().length > 0 && !t.includes('Loading documentation');
  }, undefined, { timeout: 15_000 });
  // Highlighting is the last step of the render; mdhtml.css loads on demand,
  // so a code block measured before it lands has no scroll box yet.
  await page.waitForFunction(() => [...document.querySelectorAll('#content pre code')]
    .every((b) => b.classList.contains('hljs')), undefined, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  // Live examples build as they near the viewport: scroll through, then wait.
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await frame();
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.querySelectorAll('#content [class*="x-card--"], #content [x-demo]')]
    .every((el) => el.hasAttribute('x-ready')), undefined, { timeout: 15_000 });
}

/** What spills past the screen edge on the open doc, or [] if nothing does. */
async function spills(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const pageScroll = document.documentElement.scrollWidth - vw;
    if (pageScroll > 2) out.push(`page scrolls ${pageScroll}px sideways`);
    const scrolls = (el: Element | null): boolean => {
      for (let p = el?.parentElement; p; p = p.parentElement) {
        const x = getComputedStyle(p).overflowX;
        if (x === 'auto' || x === 'scroll') return true;
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
      test.slow();
      await page.setViewportSize({ width: 375, height: 800 });
      const failures: string[] = [];
      for (const doc of batch) {
        await openAtPhoneWidth(page, doc);
        const found = await spills(page);
        if (found.length) failures.push(`${doc}: ${found.join('; ')}`);
      }
      expect(failures, 'docs that spill past a 375px screen').toEqual([]);
    });
  });
});
