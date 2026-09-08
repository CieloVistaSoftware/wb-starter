import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * #965 — 67% of card.css was discarded by the browser.
 *
 * Thirteen selectors carried a stray `)` from the `:is()` migration, and CSS
 * fails SILENTLY: a malformed selector is not an error, the browser simply drops
 * the rule and paints on without it. 178 of 264 rules were dead and everything
 * looked fine — no console message, no build warning, nothing.
 *
 * The lesson that cost the most: **counting blocks in the source proves
 * nothing.** The source still had 264 `{`. Only the browser's own parser knows
 * how many of them became rules, so that is what this asks.
 *
 * Each top-level rule is inserted INDIVIDUALLY, so a failure names the exact
 * selector rather than reporting "some rules went missing" across a 108KB file.
 */

const CSS_DIR = 'src/styles/behaviors';

/**
 * Blank out comments while PRESERVING newlines, so reported line numbers still
 * point at the real line. Stripping them outright shifted every number after the
 * first comment, and leaving them in put comment text inside the rule slice —
 * which made the parser reject a banner comment and report it as dead CSS.
 */
function blankComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Selectors this browser cannot judge. A Chromium run rejects `::-moz-*` and
 * `::-ms-*` because it does not implement them — that is correct behaviour and
 * the CSS is deliberately cross-browser, so flagging it would report working
 * styles as broken. Only selectors THIS engine is supposed to understand can be
 * held to the #965 invariant.
 */
const FOREIGN_VENDOR = /::?-(moz|ms)-/;

/** Top-level blocks of a stylesheet, by brace matching — @media and all. */
function topLevelRules(raw: string): { text: string; line: number }[] {
  const css = blankComments(raw);
  const out: { text: string; line: number }[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") {                    // skip strings
      const q = c;
      i++;
      while (i < css.length && css[i] !== q) { if (css[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const text = css.slice(start, i + 1).trim();
        if (text) out.push({ text, line: css.slice(0, start).split('\n').length });
        start = i + 1;
      }
    }
  }
  return out;
}

const files = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));

test.describe('#965: no behavior CSS rule is silently discarded by the browser', () => {
  test('the suite is actually looking at stylesheets', () => {
    expect(files.length, `${CSS_DIR} has no .css files — this spec would pass vacuously`).toBeGreaterThan(5);
  });

  for (const file of files) {
    test(`${file} — every rule survives the browser's parser`, async ({ page }) => {
      // This spec needs a CSS PARSER, not a page: it feeds rule text to
      // CSSStyleSheet.insertRule() and asks which ones the browser rejects.
      // It ran against about:blank, which works — and which
      // tests-must-assert.spec.ts:218 correctly refuses to distinguish from a
      // spec that forgot to navigate and is therefore asserting against an
      // empty document (#863's failure mode: 13 tests green, testing nothing).
      //
      // A real document costs nothing and removes the ambiguity for both the
      // gate and the next reader.
      await page.setContent('<!doctype html><meta charset="utf-8"><title>css parser harness</title>');

      const css = readFileSync(join(CSS_DIR, file), 'utf8');
      const rules = topLevelRules(css).filter((r) => !FOREIGN_VENDOR.test(r.text));
      expect(rules.length, `${file} parsed to zero top-level rules — the splitter is broken`).toBeGreaterThan(0);

      // Insert one at a time. `insertRule` THROWS on a selector the parser
      // rejects, which is the only way to learn which one — a whole-sheet
      // replaceSync() drops the bad rule and reports nothing.
      const rejected = await page.evaluate((texts: string[]) => {
        const sheet = new CSSStyleSheet();
        const bad: { index: number; head: string }[] = [];
        texts.forEach((t, index) => {
          try {
            sheet.insertRule(t, sheet.cssRules.length);
          } catch {
            bad.push({ index, head: t.slice(0, 120).replace(/\s+/g, ' ') });
          }
        });
        return bad;
      }, rules.map((r) => r.text));

      const detail = rejected
        .map((b) => `  ${file}:${rules[b.index]?.line ?? '?'}  ${b.head}`)
        .join('\n');

      expect(
        rejected,
        `The browser REJECTED ${rejected.length} of ${rules.length} rules in ${file}.\n` +
        `CSS fails silently — a malformed selector is dropped, not reported, so the page\n` +
        `paints without it and looks fine. This is #965: a stray ")" from the :is()\n` +
        `migration killed 178 of 264 rules in card.css and nothing said a word.\n\n` +
        `${detail}\n`,
      ).toEqual([]);
    });
  }
});
