/**
 * TEMPORARY DIAGNOSTIC for #1439 -- not for merge.
 *
 * Round 1 (this PR's first commit): on the Windows CI runner WebKit captures
 * a blank page in 73ms and Behaviors in ~250ms, but every capture of Home --
 * viewport or full page, animations allowed or disabled, service worker
 * blocked or not -- times out at 20s. rAF fires, fonts are loaded and the
 * height settles, so none of those is it. Home alone has infinite animations
 * (3) and a media element (1).
 *
 * Round 2 (this file): list what Home has that the others don't, then remove
 * one kind at a time on a fresh load and try a viewport capture after each.
 */
import { test, type Page } from '../fixtures/offline';

test.setTimeout(240_000);

async function inventory(page: Page) {
  return page.evaluate(() => {
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    };
    const anims = document.getAnimations().map((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return `${(a as CSSAnimation).animationName || a.constructor.name} on ${t ? describe(t) : '?'} iter=${a.effect?.getTiming().iterations}`;
    });
    const filters: string[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el);
      const bf = cs.getPropertyValue('backdrop-filter') || cs.getPropertyValue('-webkit-backdrop-filter');
      if ((bf && bf !== 'none') || (cs.filter && cs.filter !== 'none')) filters.push(`${describe(el)} filter=${cs.filter} backdrop=${bf}`);
    }
    return {
      anims,
      media: Array.from(document.querySelectorAll('audio,video')).map((m) => `${describe(m)} src=${(m as HTMLMediaElement).currentSrc || m.getAttribute('src')} preload=${m.getAttribute('preload')} ready=${(m as HTMLMediaElement).readyState}`),
      iframes: Array.from(document.querySelectorAll('iframe')).map((f) => `${describe(f)} src=${f.getAttribute('src')}`),
      canvas: document.querySelectorAll('canvas').length,
      filters: filters.slice(0, 15),
      filterCount: filters.length,
    };
  });
}

async function tryShot(page: Page, label: string) {
  const t0 = Date.now();
  try {
    await page.screenshot({ timeout: 15_000 });
    console.log(`[#1439] home minus ${label}: OK ${Date.now() - t0}ms`);
  } catch (e) {
    console.log(`[#1439] home minus ${label}: FAIL ${Date.now() - t0}ms`);
  }
}

const REMOVALS: Record<string, string> = {
  'nothing': '',
  'infinite animations': `document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).forEach(a => a.cancel());
    const s = document.createElement('style'); s.textContent = '*,*::before,*::after{animation:none!important}'; document.head.append(s);`,
  'media elements': `document.querySelectorAll('audio,video').forEach(m => { m.pause?.(); m.removeAttribute('src'); m.load?.(); m.remove(); });`,
  'filters': `const s = document.createElement('style'); s.textContent = '*,*::before,*::after{filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'; document.head.append(s);`,
};
// Combinations, in case it takes more than one.
REMOVALS['animations + filters'] = REMOVALS['infinite animations'] + REMOVALS['filters'];
REMOVALS['animations + media'] = REMOVALS['infinite animations'] + REMOVALS['media elements'];
REMOVALS['media + filters'] = REMOVALS['media elements'] + REMOVALS['filters'];
REMOVALS['all three'] = REMOVALS['infinite animations'] + REMOVALS['media elements'] + REMOVALS['filters'];

test('diag round 2: what on Home stalls the WebKit capture', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit only');

  await page.goto('/pages/home.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);
  console.log(`[#1439] home inventory ${JSON.stringify(await inventory(page))}`);

  for (const [label, js] of Object.entries(REMOVALS)) {
    await page.goto('/pages/home.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    if (js) await page.evaluate(js);
    await page.waitForTimeout(300);
    await tryShot(page, label);
  }
});
