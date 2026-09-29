/**
 * THE SCHEMA INDEX NAMES EVERY BEHAVIOR THE WAY THE RUNTIME LOOKS IT UP
 * ====================================================================
 * #1146/#1147/#1150 (one family, one index). wb.js keys data/schema-index.json
 * by `name` and builds modifier classes from `baseClass` (applyDeclaredModifiers,
 * wb.js ~351). On 4.0.6 the index still said what 4.0.0 retired:
 *
 *   50 entries  name "x-accordion", "x-hero", ...  -- the attribute, not the
 *               behavior, so schemaIndex['accordion'] missed (#1146; the
 *               schemas were fixed in 49222115, the index never regenerated)
 *  150 entries  tag "wb-*"; 88 baseClass "wb-*" -- scripts/build-schema-index
 *               still wrote wb-, so <div x-hero variant="cosmic"> built
 *               wb-hero--cosmic, a class no stylesheet defines (#1147)
 *    7 entries  no name at all (otp, password, stepper had no schemaFor), so
 *               wb.js dropped them (#1150)
 */
import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

const index = JSON.parse(readFileSync('data/schema-index.json', 'utf8'));
const schemas: Array<{ file: string; name?: string; tag?: string; baseClass?: string }> = index.schemas || [];

test('every index entry has a name, and it is the behavior name, not the x- attribute', () => {
  expect(schemas.length, 'index parsed').toBeGreaterThan(100);
  expect(schemas.filter((s) => !s.name).map((s) => s.file), 'entries wb.js drops for want of a name').toEqual([]);
  expect(schemas.filter((s) => String(s.name).startsWith('x-')).map((s) => s.name)).toEqual([]);
});

test('no index entry carries a retired wb- tag or class', () => {
  const wb = schemas.filter((s) => String(s.tag || '').startsWith('wb-') || String(s.baseClass || '').startsWith('wb-'))
    .map((s) => `${s.file}: tag=${s.tag} baseClass=${s.baseClass}`);
  expect(wb).toEqual([]);
});

test('wb.js applies a declared modifier: <div x-hero variant="cosmic"> gets .x-hero--cosmic', async ({ page }) => {
  // tests/fixtures/blank.html first, so the absolute module import resolves.
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`<div id="h" x-hero variant="cosmic" title="Hello"></div>`);
  await page.addStyleTag({ url: '/src/styles/x-signature.css' });
  await page.addScriptTag({
    type: 'module',
    content: `
      import WB from '/src/core/wb.js';
      await WB.init({ autoInject: true });
      await WB.scan(document.body);
      await WB.whenIdle({ timeout: 10000 });
      document.body.dataset.built = '1';
    `,
  });
  await page.waitForFunction(() => document.body.dataset.built === '1');
  await expect(page.locator('#h')).toHaveClass(/\bx-hero--cosmic\b/);
});

/**
 * The check behind every declared modifier (#885). It walked a rule's
 * cssRules INSTEAD of its selector whenever cssRules existed -- and since CSS
 * nesting every CSSStyleRule has one, empty. It answered false for every
 * class in Chromium, so no schema-declared modifier was ever applied.
 */
test('styleSheetDefinesClass sees classes a loaded stylesheet defines, including nested ones', async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
  await page.addStyleTag({ content: '.probe-flat { color: red } @media (min-width: 1px) { .probe-media { color: red } } .probe-host { &.probe-nested { color: red } }' });
  const seen = await page.evaluate(async () => {
    const { styleSheetDefinesClass, resetStyleRegistry } = await import('/src/core/style-registry.js');
    resetStyleRegistry();
    return ['probe-flat', 'probe-media', 'probe-host', 'probe-nested', 'probe-missing']
      .map((c) => `${c}:${styleSheetDefinesClass(c)}`);
  });
  expect(seen).toEqual(['probe-flat:true', 'probe-media:true', 'probe-host:true', 'probe-nested:true', 'probe-missing:false']);
});
