import { test, expect } from '../fixtures/offline';

/**
 * A card hero's buttons line up with the rest of its content (#1619).
 *
 * On a centered hero the title and subtitle were centered but the button pair
 * started at the left edge of the text column: on a 1200px hero its center sat
 * ~140px left of the hero's. The CTA row had `justify-content: inherit`, and
 * its parent sets none, so it inherited `normal` (packed at the start).
 * `text-align: center` centres text but never moves flex items.
 *
 * Holds, for every xalign on the default and split variants, with the hero's
 * entrance animation finished:
 *   - center: the pair's center is the hero's center (within 2px);
 *   - left (and split): the pair starts at the row's start;
 *   - right (and split + right): the pair ends at the row's end.
 */

const CASES = [
  { variant: 'default', xalign: 'center', expect: 'center' },
  { variant: 'default', xalign: 'left', expect: 'start' },
  { variant: 'default', xalign: 'right', expect: 'end' },
  { variant: 'split', xalign: 'center', expect: 'start' },
  { variant: 'split', xalign: 'left', expect: 'start' },
  { variant: 'split', xalign: 'right', expect: 'end' },
] as const;

test('x-cardhero buttons follow the hero alignment (#1619)', async ({ page }) => {
  await page.setViewportSize({ width: 1300, height: 900 });
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20_000 });

  for (const c of CASES) {
    const m = await page.evaluate(async ({ variant, xalign }) => {
      document.querySelectorAll('.cta-align-case').forEach((el) => el.remove());
      const host = document.createElement('div');
      host.className = 'cta-align-case';
      host.style.width = '1200px';
      host.innerHTML = `<section x-cardhero title="Build faster" subtitle="Schema-first, zero-build behaviors." xalign="${xalign}"`
        + (variant === 'default' ? '' : ` variant="${variant}"`)
        + ` cta="Get Started" cta-href="#a" cta-secondary="View Docs" cta-secondary-href="#b" height="380px"></section>`;
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      await (window as any).WB.whenIdle({ timeout: 10_000 });
      const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
      await Promise.all(finite.map((a) => a.finished.catch(() => {})));
      const hero = host.firstElementChild as HTMLElement;
      const row = hero.querySelector('.x-card__cta-group') as HTMLElement;
      const btns = [...row.querySelectorAll('a.x-hero-cta')].map((a) => a.getBoundingClientRect());
      const h = hero.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      const left = Math.min(...btns.map((b) => b.left));
      const right = Math.max(...btns.map((b) => b.right));
      return { heroCenter: h.left + h.width / 2, rowLeft: r.left, rowRight: r.right, pairLeft: left, pairRight: right, pairCenter: (left + right) / 2, count: btns.length };
    }, c);

    const where = `${c.variant} xalign=${c.xalign}`;
    expect(m.count, `${where}: both buttons rendered`).toBe(2);
    if (c.expect === 'center') {
      expect(Math.abs(m.pairCenter - m.heroCenter), `${where}: button pair center ${Math.round(m.pairCenter)} vs hero center ${Math.round(m.heroCenter)}`).toBeLessThanOrEqual(2);
    } else if (c.expect === 'start') {
      expect(Math.abs(m.pairLeft - m.rowLeft), `${where}: the pair starts at the row's start`).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(m.rowRight - m.pairRight), `${where}: the pair ends at the row's end`).toBeLessThanOrEqual(1);
    }
  }
});
