import { test, expect } from '@playwright/test';

/**
 * variant="split" lays out as a split, and honours height=.
 *
 * John: "doesn't render correct too narrow / variant of split doesn't work
 * layout wise", on
 *
 *     <div x-cardhero variant="split" xalign="right" height="440px" …>
 *
 * Measured in the playground preview (562px pane, 522px hero):
 *   - content column 224px  — hero.css pins it at `max-width: 46%`, a fixed
 *     fraction with no floor, so a narrow hero gets a narrow column and the
 *     other 54% stays empty
 *   - height 774px against height="440px"  — the text cannot fit 224px, so it
 *     wraps until the box grows to nearly double what the markup asked for
 *
 * 46% is right for a wide hero and wrong for a narrow one. A hero already
 * establishes a container (`container-type: inline-size`, hero.css), so the
 * split can collapse to full width below the point where two halves stop
 * fitting — which is what the layout means, rather than a fraction applied
 * unconditionally.
 *
 * Measured at three widths: wide (split applies), narrow (split collapses),
 * and the playground's own pane width (the case reported).
 */

const HERO =
  '<div id="probe" x-cardhero pretitle="v3 #3" title="Themeable to the core" ' +
  'subtitle="Every color flows from one theme system." height="440px" ' +
  'xalign="right" variant="split" cta="Explore themes" cta-href="#" ' +
  'background="linear-gradient(135deg, var(--success-color), var(--info-color))"></div>';

const DECLARED_HEIGHT = 440;

type Shot = { hostWidth: number; heroW: number; heroH: number; contentW: number; share: number };

async function measure(page: any, widths: number[]): Promise<Shot[]> {
  return page.evaluate(async ({ widths, markup }) => {
    const out: any[] = [];
    for (const hostWidth of widths) {
      const host = document.createElement('div');
      host.style.cssText = `width:${hostWidth}px`;
      host.innerHTML = markup;
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 250));

      const el = document.getElementById('probe') as HTMLElement;
      const content = el.querySelector('.x-card__hero-content') as HTMLElement;
      const heroW = el.getBoundingClientRect().width;
      const contentW = content ? content.getBoundingClientRect().width : 0;
      out.push({
        hostWidth,
        heroW: Math.round(heroW),
        heroH: Math.round(el.getBoundingClientRect().height),
        contentW: Math.round(contentW),
        share: heroW ? Math.round((contentW / heroW) * 100) : 0,
      });
      host.remove();
    }
    return out;
  }, { widths, markup: HERO });
}

test.describe('cardhero variant="split"', () => {
  let shots: Shot[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    shots = await measure(page, [1200, 562, 380]);
    await page.close();
  });

  test('the sweep actually ran', () => {
    expect(shots.length).toBe(3);
    expect(shots.every((s) => s.heroW > 0), 'a hero failed to render at all').toBe(true);
  });

  test('a wide hero really does split', () => {
    // The variant has to still MEAN something where there is room for it,
    // or "collapse when narrow" would be satisfied by never splitting.
    const wide = shots.find((s) => s.hostWidth === 1200)!;
    expect(wide.share, `content took ${wide.share}% of a ${wide.heroW}px hero`)
      .toBeLessThanOrEqual(60);
    expect(wide.share, 'the content column vanished').toBeGreaterThan(20);
  });

  test('a narrow hero gives its content the full width', () => {
    // 46% of a narrow hero is a sliver. Below the point where two halves fit,
    // a split has nothing to split.
    for (const s of shots.filter((x) => x.hostWidth <= 562)) {
      expect(
        s.share,
        `at ${s.heroW}px the content column was ${s.contentW}px (${s.share}%) — ` +
        'a fixed fraction applied where there is no room for two halves',
      ).toBeGreaterThanOrEqual(75);
    }
  });

  test('height= is honoured at every width', () => {
    // The reported symptom: 774px tall against height="440px", because the
    // text could not fit the 224px column and wrapped until the box grew.
    const tall = shots
      .filter((s) => s.heroH > DECLARED_HEIGHT * 1.25)
      .map((s) => `${s.heroW}px wide rendered ${s.heroH}px tall for height="440px"`);
    expect(tall, 'the hero grew well past the height its markup declared').toEqual([]);
  });
});
