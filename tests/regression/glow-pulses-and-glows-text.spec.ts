import { test, expect } from '../fixtures/offline';

/**
 * x-glow pulses, can glow the letters, and respects reduced motion (#816).
 *
 * `.x-glow { animation: x-glow … }` named a keyframe that existed nowhere, so
 * the "pulsing halo" the docs describe never pulsed: an unknown animation-name
 * is not a CSS error (#847, #866). And box-shadow rings the element's
 * rectangle, which on a heading is the line box, not the letters -- John's
 * question was a glowing heading. target="text" now glows the letters.
 */
async function probe(page: import('@playwright/test').Page, markup: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  return page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = host.firstElementChild as HTMLElement;
    const cs = getComputedStyle(el);
    const names = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(rules)) if (rule instanceof CSSKeyframesRule) names.add(rule.name);
    }
    return {
      cls: el.className,
      animationName: cs.animationName,
      keyframeExists: names.has(cs.animationName),
      boxShadow: cs.boxShadow,
      textShadow: cs.textShadow,
    };
  }, markup);
}

test('the box glow pulses: its animation names a keyframe that exists', async ({ page }) => {
  const r = await probe(page, '<button x-glow>Start</button>');
  expect(r.animationName).toBe('x-glow');
  expect(r.keyframeExists, 'animation-name x-glow resolves to an @keyframes').toBe(true);
  expect(r.boxShadow).not.toBe('none');
});

test('target="text" glows the letters, steady, and not the box', async ({ page }) => {
  const r = await probe(page, '<h3 x-glow target="text" color="#06b6d4">Night mode</h3>');
  expect(r.cls).toContain('x-glow--text');
  expect(r.textShadow, 'the letters carry the glow').not.toBe('none');
  expect(r.boxShadow, 'the line box does not').toBe('none');
  expect(r.animationName, 'a heading glow holds steady').toBe('none');
});

test('a reader who prefers reduced motion keeps the glow without the pulse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const r = await probe(page, '<button x-glow>Start</button>');
  expect(r.animationName).toBe('none');
  expect(r.boxShadow).not.toBe('none');
});
