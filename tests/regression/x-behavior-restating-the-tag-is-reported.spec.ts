import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * <pre x-behavior="pre"> says the same thing twice (#967).
 *
 * John: `<input x-behavior="input">` -- "this should never happen." The tag
 * already IS the behavior (tag-map.js nativeMap), so the attribute adds
 * nothing. #935 made `<article x-card>` report exactly this through the error
 * log; the `x-behavior="name"` spelling reached the guard as the directive
 * `behavior` and was never checked.
 *
 * John chose option 2 on #967: report it only where the tag really does
 * auto-inject its behavior. With auto-inject off, <pre x-behavior="pre"> is
 * the only way a <pre> gets its behavior, so it must stay silent there. The
 * framework's own markup no longer writes x-behavior at all (#1642), so the
 * report only ever names something an author wrote.
 *
 * Each case runs on both runtimes: the lazy one (demos/test-harness.html)
 * and wb.js (the site shell, /?page=home).
 */

const CODE = 'redundant-behavior-attribute';

type Run = { reported: string[]; enhanced: boolean };

/**
 * Mount `markup` on a page already running a runtime, scan it eagerly, and
 * return what the replacement guard logged for it.
 */
async function mount(page: any, markup: string, autoInject: boolean): Promise<Run> {
  return page.evaluate(async ({ markup, autoInject, code }) => {
    const { setConfig } = await import('/src/core/config.js');
    const { getErrors } = await import('/src/core/error-logger.js');
    setConfig('autoInject', autoInject);
    const before = getErrors().length;
    const c = document.createElement('div');
    c.innerHTML = markup;
    document.body.appendChild(c);
    await (window as any).WB.scan(c, { eager: true });
    if (typeof (window as any).WB.whenIdle === 'function') await (window as any).WB.whenIdle({ timeout: 10000 });
    const host = c.firstElementChild as HTMLElement;
    const reported = getErrors().slice(before)
      .filter((e: any) => (e.context?.code || e.code) === code || /says the same thing twice/.test(e.message || ''))
      .map((e: any) => String(e.message));
    const enhanced = host.className.split(/\s+/).some((cls) => cls.startsWith('x-'));
    c.remove();
    return { reported, enhanced };
  }, { markup, autoInject, code: CODE });
}

const RUNTIMES = [
  { name: 'wb-lazy', url: '/demos/test-harness.html' },
  { name: 'wb.js', url: '/?page=home' },
];

for (const rt of RUNTIMES) {
  test.describe(`${rt.name}: x-behavior that restates the tag (#967)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(rt.url);
      await page.waitForFunction(() => (window as any).WB?.scan, { timeout: 20000 });
      // #961: on the site shell, wait for it to finish booting first. Its boot
      // calls WB.init({ autoInject: <site config> }) once config/site.json
      // arrives; landing after mount()'s setConfig('autoInject', false), it
      // switched auto-inject back on mid-scan and the "auto-inject off is
      // silent" case reported (CI, 2026-10-07). wbIdle() waits for that boot.
      await wbIdle(page);
    });

    test('<pre x-behavior="pre"> on an auto-inject page is reported, naming what was written', async ({ page }) => {
      const run = await mount(page, '<pre x-behavior="pre"><code>let a = 1;</code></pre>', true);
      expect(run.reported, 'one report for the restated behavior').toHaveLength(1);
      expect(run.reported[0]).toContain('x-behavior="pre"');
      expect(run.enhanced, 'the behavior still runs').toBe(true);
    });

    test('the same markup with auto-inject off is silent: the attribute is the only way in', async ({ page }) => {
      const run = await mount(page, '<pre x-behavior="pre"><code>let a = 1;</code></pre>', false);
      expect(run.reported).toEqual([]);
      expect(run.enhanced, 'x-behavior still applies it').toBe(true);
    });

    for (const markup of [
      '<span x-behavior="chip">Chip</span>',
      '<button x-behavior="tooltip" tooltip="Hi">Hover</button>',
      '<article x-behavior="cardimage" title="T" src="/images/placeholder.svg"></article>',
    ]) {
      test(`not redundant, stays silent: ${markup.slice(0, markup.indexOf('>') + 1)}`, async ({ page }) => {
        const run = await mount(page, markup, true);
        expect(run.reported).toEqual([]);
      });
    }
  });
}
