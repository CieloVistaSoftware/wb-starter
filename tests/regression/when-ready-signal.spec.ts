import { test, expect } from '../fixtures/offline';

/**
 * WB.whenReady(el) — the one race-free way to wait for an element to finish
 * building (src/core/ready-signal.js).
 *
 * Readiness is a once-only `wb:ready` moment plus WB.isReady(). Waiting needed
 * both: a listener alone hangs when the moment already passed, a check alone
 * misses one still to come. Callers wrote the pair by hand or watched the
 * `x-ready` attribute, which exists only under automation. whenReady() is the
 * pair, written once; tests/base.ts elementReady() now uses it.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
});

test('resolves at once for an element already built, and on wb:ready for one that is not', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { markReady, whenReady } = await import('/src/core/ready-signal.js');
    const built = document.body.appendChild(document.createElement('div'));
    markReady(built);
    let builtResolved = false;
    await whenReady(built).then(() => { builtResolved = true; });

    const later = document.body.appendChild(document.createElement('div'));
    let laterResolved = false;
    const waiting = whenReady(later).then(() => { laterResolved = true; });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const beforeMark = laterResolved;
    markReady(later);
    await waiting;
    return { builtResolved, beforeMark, laterResolved };
  });
  expect(r).toEqual({ builtResolved: true, beforeMark: false, laterResolved: true });
});

test("a descendant's wb:ready does not count for its parent", async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { markReady, whenReady } = await import('/src/core/ready-signal.js');
    const parent = document.body.appendChild(document.createElement('section'));
    const child = parent.appendChild(document.createElement('span'));
    let parentResolved = false;
    const waiting = whenReady(parent).then(() => { parentResolved = true; });
    markReady(child); // bubbles up through parent
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const afterChild = parentResolved;
    markReady(parent);
    await waiting;
    return { afterChild, parentResolved };
  });
  expect(r).toEqual({ afterChild: false, parentResolved: true });
});

test('a timeout rejects and names the element', async ({ page }) => {
  const message = await page.evaluate(async () => {
    const { whenReady } = await import('/src/core/ready-signal.js');
    const el = document.body.appendChild(document.createElement('div'));
    el.id = 'never-built';
    return whenReady(el, { timeout: 50 }).then(() => 'resolved', (e) => String(e.message));
  });
  expect(message).toContain('<div id="never-built">');
  expect(message).toContain('scroll to it first');
});

test('both runtimes expose WB.whenReady(), and it resolves for an element they build', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const lazy = (await import('/src/core/wb-lazy.js')).default;
    const full = (await import('/src/core/wb.js')).default;
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = '<button id="b" x-ripple>Go</button>';
    const button = host.querySelector('#b')!;
    const waiting = lazy.whenReady(button, { timeout: 10000 });
    await lazy.scan(host, { eager: true });
    await waiting;
    return { lazy: typeof lazy.whenReady, full: typeof full.whenReady, ready: lazy.isReady(button) };
  });
  expect(r).toEqual({ lazy: 'function', full: 'function', ready: true });
});
