import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * #1757 follow-up: revealing a measuring demo's code panel must not start a
 * CSS transition.
 *
 * 9d29c0b4 hid the whole panel with `visibility: hidden` while the block is
 * .x-demo--measuring. visibility is inherited and interpolable, and the panel's
 * copy button (.x-pre__copy) carries `transition: all 0.2s`, so dropping the
 * class started a 0.2s visibility transition on every copy button.
 *
 * On pages/demos.html the four inline demos sit in CLOSED <details>, whose
 * content Chromium skips (content-visibility: hidden). An animation in a
 * skipped subtree still reaches playState 'finished', but Chromium never
 * services it, so its `finished` promise never resolves. Measured: awaiting
 * those two transitions' `finished` (the settle step in
 * demo-layout-standards.spec.ts and no-element-overlap.spec.ts) was still
 * pending after 20s with both at playState 'finished', currentTime 19999.
 * Locally the 0.2s window had passed before the specs looked; on a slower
 * Windows runner the settle step caught it and hung until the test timeout.
 *
 * This records the animations a reveal starts, synchronously at the class
 * change (Element.getAnimations flushes style), so it sees them whatever the
 * load timing, then runs the specs' own settle await on them.
 */
test.describe.configure({ timeout: 60_000 });

test('pages/demos.html: revealing a measured code panel starts no transition (#1757)', async ({ page }) => {
  await page.addInitScript(() => {
    const started: string[] = [];
    const anims: Animation[] = [];
    let reveals = 0;
    (window as any).__revealStarted = started;
    (window as any).__revealAnims = anims;
    (window as any).__reveals = () => reveals;
    new MutationObserver((ms) => ms.forEach((m) => {
      const el = m.target as Element;
      if (!el.matches('[x-demo]')) return;
      if (!(m.oldValue || '').split(/\s+/).includes('x-demo--measuring')) return;
      if (el.classList.contains('x-demo--measuring')) return;
      reveals += 1;
      el.getAnimations({ subtree: true }).forEach((a) => {
        if (a.effect?.getTiming().iterations === Infinity) return;
        anims.push(a);
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        const prop = (a as any).transitionProperty || (a as any).animationName || a.id;
        started.push(`${prop} on .${(t?.className || '?').toString().trim().replace(/\s+/g, '.')}`);
      });
    })).observe(document, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  });

  await page.goto('/pages/demos.html');
  await wbIdle(page, { timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('[x-demo]').length >= 4 && !document.querySelector('[x-demo].x-demo--measuring'),
    undefined,
    { timeout: 30_000 },
  );

  const reveals = await page.evaluate(() => (window as any).__reveals());
  expect(reveals, 'no measuring demo was revealed -- the page or the observer is broken').toBeGreaterThanOrEqual(4);

  const started = await page.evaluate(() => (window as any).__revealStarted);
  expect(started, 'animations started by revealing a measured code panel').toEqual([]);

  // The compliance specs' settle step, on exactly those animations.
  const settled = await page.evaluate(async () => {
    const anims: Animation[] = (window as any).__revealAnims;
    const all = Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => 'settled');
    return Promise.race([all, new Promise((r) => setTimeout(() => r('still pending after 5s'), 5000))]);
  });
  expect(settled, 'awaiting the reveal animations\' `finished` (demo-layout-standards / no-element-overlap settle)').toBe('settled');
});
