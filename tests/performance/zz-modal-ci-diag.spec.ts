import { test, chromium, newOfflinePage, type Browser } from '../fixtures/offline';

/**
 * TEMPORARY CI diagnostic for #961 (Modal should open in under 200ms). Removed
 * before the PR is ready. Measures the modal click on a COLD browser (a fresh
 * launch per sample, as the first test of a worker is) in two page states:
 *   boot    -- what interaction.spec.ts on main does: click as soon as window.WB exists
 *   settled -- WBSite published, the Behaviors list final and a row selected,
 *              WB.settled(), two frames
 * and prints, per sample, the synchronous click time, whether the dialog was
 * open straight after click(), the frame wait, and the Long Animation Frame
 * entry covering the click (forced style/layout, script attribution).
 * Never fails: it is evidence.
 */
test.describe.configure({ timeout: 240_000 });

const SAMPLES = 5;

async function sample(browser: Browser, mode: 'boot' | 'settled', baseURL: string | undefined) {
  const page = await newOfflinePage(browser, { viewport: { width: 1280, height: 720 }, baseURL });
  await page.addInitScript(() => {
    const W = window as any;
    W.__diag = { loaf: [] as any[], firstRaf: 0, wbAt: 0 };
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as any[]) {
          W.__diag.loaf.push({
            start: Math.round(e.startTime), dur: Math.round(e.duration), blocking: Math.round(e.blockingDuration || 0),
            styleAndLayoutStart: Math.round(e.styleAndLayoutStart || 0), renderStart: Math.round(e.renderStart || 0),
            scripts: (e.scripts || []).map((s: any) => ({
              invoker: String(s.invoker).slice(0, 80), src: String(s.sourceURL || '').split('/').pop(), fn: s.sourceFunctionName,
              start: Math.round(s.startTime), dur: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration || 0),
            })),
          });
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
    } catch { /* unsupported */ }
    const tick = () => { if (!W.__diag.firstRaf) W.__diag.firstRaf = Math.round(performance.now()); else return; };
    requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  await page.goto('/?page=behaviors');
  const gotoMs = Date.now() - t0;
  await page.waitForFunction(() => Boolean((window as any).WB));
  const wbWaitMs = Date.now() - t0 - gotoMs;
  if (mode === 'settled') {
    await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 30000 });
    await page.waitForFunction(() => {
      const list = document.getElementById('behaviors-search-results');
      return Boolean(list && list.getAttribute('aria-busy') !== 'true' && list.querySelector('.behaviors-search-results__row[aria-current="true"]'));
    }, undefined, { timeout: 30000 });
    await page.evaluate(async () => {
      await (window as any).WB.settled();
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    });
  }
  const r = await page.evaluate(async () => {
    const W = window as any;
    const host = document.createElement('div');
    host.id = 'perf-host';
    host.innerHTML = '<button x-modal modal-title="Perf" modal-content="Opened.">Open</button>';
    document.body.append(host);
    const s0 = performance.now();
    await W.WB.scan(host, { eager: true });
    const scanMs = performance.now() - s0;
    const state = {
      now: Math.round(performance.now()), site: 'WBSite' in window, pending: W.WB.pendingCount,
      nodes: document.getElementsByTagName('*').length,
      rows: document.querySelectorAll('.behaviors-search-results__row').length,
      sheets: document.styleSheets.length,
      firstPaint: Math.round((performance.getEntriesByName('first-paint')[0] as any)?.startTime || 0),
      firstRaf: W.__diag.firstRaf, fonts: (document as any).fonts?.status,
    };
    const el = document.querySelector('#perf-host [x-modal]') as HTMLElement;
    const t0 = performance.now();
    el.click();
    const syncMs = performance.now() - t0;
    const openAfterClick = Boolean(document.querySelector('dialog[open]'));
    let frames = 0;
    const total: number = await new Promise((res) => {
      const c = () => { if (document.querySelector('dialog[open]')) return res(performance.now() - t0); frames++; if (performance.now() - t0 > 5000) return res(5000); requestAnimationFrame(c); };
      c();
    });
    // let the LoAF entry for the click frame be delivered
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const loaf = W.__diag.loaf.filter((e: any) => e.start + e.dur >= t0 - 1 && e.start <= t0 + total + 1);
    return { scanMs: Math.round(scanMs), t0: Math.round(t0), syncMs: Math.round(syncMs * 10) / 10, openAfterClick, frames, total: Math.round(total * 10) / 10, state, loaf };
  });
  await page.context().close();
  return { mode, gotoMs, wbWaitMs, ...r };
}

test('modal click on a cold browser: boot vs settled (diagnostic, #961)', async ({ baseURL }) => {
  for (let i = 0; i < SAMPLES; i++) {
    for (const mode of ['boot', 'settled'] as const) {
      const browser = await chromium.launch();
      try {
        const res = await sample(browser, mode, baseURL);
        console.log('MODAL-DIAG ' + JSON.stringify(res));
      } catch (err) {
        console.log('MODAL-DIAG-ERROR ' + mode + ' ' + (err as Error).message.split('\n')[0]);
      } finally {
        await browser.close();
      }
    }
  }
});
