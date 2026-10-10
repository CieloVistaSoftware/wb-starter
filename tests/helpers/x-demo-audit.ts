import type { Page } from '@playwright/test';

/**
 * Build every `<div x-demo>` on a page, then say which ones did not render
 * (#1817). Used by tests/compliance/live-examples-render.spec.ts.
 *
 * WHY A WAIT ON THE BUILDS, measured: that spec used to scroll each block into
 * view with a 1.5s cap, then wait 5s for the grids to fill, and swallow both
 * timeouts. Under CPU throttling (CDP Emulation.setCPUThrottlingRate 6),
 * demos/frameworks.html's only demo, about 6,800px down the page, lost that
 * race every time. The capped scroll timed out before the busy page answered,
 * so the page was never scrolled. The 5s wait then ran out with the demo still
 * queued (WB.pendingBehaviors: "demo"), and the audit reported "no
 * .x-demo__grid was built at all". The same demo built every time it was kept
 * in view (8 of 8). demo() never skips its grid; the test looked too soon.
 */

/**
 * Keep the first `[x-demo]` that is not finished yet in view, every frame,
 * until none is left. Resolves true when all are finished, or false when
 * `timeoutMs` runs out first; the audit then names the ones left over.
 *
 * "Finished" means WB has built the block (WB.isReady(), or x-ready without
 * WB), and at least one child of its grid has a rendered size. The second half
 * matters: a block can be built while its children's own behaviors are still
 * waiting for the viewport. An `<span x-rating>` has no size until it is
 * built, so a block built inside the runtime's 1200px margin, and then
 * scrolled past, would read as broken. A block that is built but has no grid,
 * or an empty one, is final: waiting would not change it, so it is not waited
 * on, and auditDemos() reports it.
 *
 * Re-scrolled every frame because content above a block keeps growing as it
 * builds, and can push the block back out of that margin. This is the same
 * reason as buildInView in tests/base.ts.
 */
export async function buildEveryDemo(page: Page, timeoutMs: number): Promise<boolean> {
  return page
    .waitForFunction(() => {
      const WB = (window as any).WB;
      const built = (d: Element) => (WB && typeof WB.isReady === 'function' ? WB.isReady(d) : d.hasAttribute('x-ready'));
      const unfinished = (d: Element) => {
        if (!built(d)) return true;
        const grid = d.querySelector('.x-demo__grid');
        if (!grid || grid.children.length === 0) return false;   // final: reported, not awaited
        return !Array.from(grid.children).some((k) => {
          const r = k.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
      };
      const next = Array.from(document.querySelectorAll('[x-demo]')).find(unfinished);
      if (!next) return true;
      next.scrollIntoView({ block: 'center' });
      return false;
    }, null, { polling: 'raf', timeout: timeoutMs })
    .then(() => true, (e: Error) => {
      if (e?.name === 'TimeoutError') return false;
      throw e;
    });
}

/**
 * One line per `[x-demo]` that did not render real content. A block with no
 * grid is reported in one of two ways. If it is still unbuilt, the build was
 * slow. If it finished building, demo() skipped its own grid. The two are
 * different defects, so they are worded differently.
 */
export async function auditDemos(page: Page, waitedMs: number): Promise<string[]> {
  return page.evaluate((waited) => {
    const WB = (window as any).WB;
    const built = (d: Element) => (WB && typeof WB.isReady === 'function' ? WB.isReady(d) : d.hasAttribute('x-ready'));
    const problems: string[] = [];
    document.querySelectorAll('[x-demo]').forEach((demo, i) => {
      const grid = demo.querySelector('.x-demo__grid');
      if (!grid) {
        problems.push(built(demo)
          ? `[x-demo][${i}]: finished building but no .x-demo__grid was built at all`
          : `[x-demo][${i}]: still not built after ${waited}ms in view (WB.pendingBehaviors: ${WB?.pendingBehaviors ?? 'n/a'})`);
        return;
      }
      const kids = Array.from(grid.children) as HTMLElement[];
      if (kids.length === 0) {
        problems.push(`[x-demo][${i}]: .x-demo__grid built but has zero rendered children`);
        return;
      }
      const anyVisible = kids.some((k) => {
        const r = k.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!anyVisible) {
        const label = (demo.textContent || '').trim().slice(0, 50);
        problems.push(`x-demo[${i}] "${label}": has ${kids.length} child(ren) but none has a non-zero rendered size (upgrade likely failed silently)`);
      }
    });
    return problems;
  }, waitedMs);
}
