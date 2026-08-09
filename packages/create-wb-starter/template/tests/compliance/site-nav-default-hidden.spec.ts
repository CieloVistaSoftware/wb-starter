/**
 * #293 regression, reported live on a real Samsung phone: the full sidebar
 * flashed visible on first paint on a phone, where it must start hidden.
 *
 * Root cause: .site__nav's base (unconditional) rule was `display: flex`,
 * only hidden via a max-width media query. Some real mobile browsers lay
 * out the very first frame at a stale desktop-width viewport before
 * <meta viewport> finishes processing, so that media query can silently
 * fail to match on that frame — falling through to the visible base rule.
 * A JS workaround (site-engine.js's old enforceMobileNavDefault, since
 * removed) tried to correct this via window.innerWidth, but that reads the
 * same wrong viewport during the same race and can't be trusted either.
 *
 * This can't be reproduced as a Playwright browser test — Playwright sets
 * the viewport deterministically before navigation, so the race never
 * occurs, and this is a schema-first SPA (site-engine.js builds the whole
 * shell via JS) so disabling JavaScript just means .site__nav never exists
 * at all. The only reliable gate is a source-level check that the CSS
 * default itself can never regress back to visible.
 */
import { test, expect } from '@playwright/test';
import { ROOT, readFile } from '../base';
import * as path from 'path';

function extractFirstRuleBlock(css: string, selector: string): string {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`Selector "${selector}" not found`);
  let depth = 0;
  let i = start + marker.length - 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return css.slice(start, i + 1);
}

test.describe('#293 — .site__nav CSS default must stay hidden, not the visible sidebar', () => {
  const cssPath = path.join(ROOT, 'src/styles/site.css');
  const css = readFile(cssPath);

  test('the unconditional base .site__nav rule (outside any @media) is display:none', () => {
    const block = extractFirstRuleBlock(css, '.site__nav').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(block, 'the FIRST .site__nav { ... } block in site.css is the unconditional base rule — it must default to hidden so a mobile first-paint viewport-detection race can never show the full sidebar on a phone').toMatch(/display:\s*none/);
    expect(block).not.toMatch(/display:\s*flex/);
  });

  test('a min-width media query restores the sidebar for desktop/tablet', () => {
    const minWidthBlockMatch = css.match(/@media\s*\(min-width:\s*\d+px\)\s*\{[^}]*\.site__nav\s*\{[^}]*display:\s*flex/);
    expect(minWidthBlockMatch, 'expected a @media (min-width: ...) block restoring .site__nav to display:flex for large screens').not.toBeNull();
  });

  test('the mobile-open toggle state always wins regardless of breakpoint (unconditional, !important)', () => {
    expect(css).toMatch(/\.site__nav\.site__nav--mobile-open\s*\{\s*display:\s*flex\s*!important;\s*\}/);
  });
});
