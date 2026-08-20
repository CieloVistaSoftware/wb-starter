/**
 * #689 — a native <details> authored with `summary` as an ATTRIBUTE got no
 *        <summary> element and no .wb-details__content wrapper, so the 1rem
 *        padding never applied and the authored label never rendered.
 * #690 — the behaviors browse panel sits inside .page__hero, so site.css's hero
 *        rules styled whatever a DEMO rendered: <p> at 1.25rem, muted, capped
 *        at 600px and auto-centred.
 *
 * Both showed up as "the gaps here are not right": summary flush in the corner,
 * image at the border, paragraph inset 48px — three insets in one box.
 */
import { test, expect, Page } from '@playwright/test';

async function showDetailsDemo(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 20000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 20000 },
  );
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')]
      .find((r) => r.getAttribute('data-browse-token') === 'x-details'
                && r.getAttribute('data-variant') === 'true') as HTMLElement;
    if (!row) throw new Error('x-details/true row not found in the browse list');
    row.click();
  });
  await page.waitForSelector('#behaviors-live-stage details', { timeout: 10000 });
  await page.waitForTimeout(400);
}

test.describe('#689 — native <details> gets a summary element and a content wrapper', () => {
  test('the authored summary attribute renders as the label', async ({ page }) => {
    await showDetailsDemo(page);
    const label = await page.evaluate(() => {
      const sum = document.querySelector('#behaviors-live-stage details summary');
      return sum ? sum.textContent!.replace(/\s+/g, ' ').trim() : null;
    });
    expect(label, 'a <summary> element must exist').not.toBeNull();
    expect(label, 'must show the authored text, not the UA "Details" fallback').toContain('Trail conditions');
  });

  test('summary and content share one inset, and the image sits on it', async ({ page }) => {
    await showDetailsDemo(page);
    const geo = await page.evaluate(() => {
      const det = document.querySelector('#behaviors-live-stage details') as HTMLElement;
      const sum = det.querySelector('summary') as HTMLElement;
      const content = det.querySelector('.wb-details__content') as HTMLElement;
      const img = det.querySelector('img') as HTMLElement;
      const p = det.querySelector('p') as HTMLElement;
      const left = (el: HTMLElement) => Math.round(el.getBoundingClientRect().left);
      return {
        hasContent: !!content,
        summaryPad: getComputedStyle(sum).padding,
        contentPad: content ? getComputedStyle(content).padding : null,
        imgLeft: img ? left(img) : null,
        pLeft: p ? left(p) : null,
      };
    });

    expect(geo.hasContent, 'children must be wrapped in .wb-details__content').toBe(true);
    expect(geo.summaryPad, 'summary keeps the 1rem the styling code applies').toBe('16px');
    expect(geo.contentPad, 'content gets the same 1rem').toBe('16px');
    expect(geo.imgLeft, 'image and paragraph must sit on the same inset').toBe(geo.pLeft);
  });

  test('a <details> that brings its own <summary> is left alone', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 20000 });

    const result = await page.evaluate(async () => {
      const mod: any = await import('/src/wb-viewmodels/semantics/details.js');
      const host = document.createElement('div');
      host.innerHTML = '<details summary="Ignored"><summary>Mine</summary><p>body</p></details>';
      document.body.appendChild(host);
      const det = host.querySelector('details') as HTMLElement;
      mod.details(det, {});
      const summaries = det.querySelectorAll('summary');
      const label = summaries[0].textContent!.replace(/\s+/g, ' ').trim();
      host.remove();
      return { count: summaries.length, label };
    });

    expect(result.count, 'must not add a second <summary>').toBe(1);
    expect(result.label, "the element's own summary wins over the attribute").toContain('Mine');
  });
});

test.describe('#690 — demo output does not inherit hero typography', () => {
  test('a demo paragraph is not capped, centred, or muted by the hero rule', async ({ page }) => {
    await showDetailsDemo(page);
    const p = await page.evaluate(() => {
      const el = document.querySelector('#behaviors-live-stage details p') as HTMLElement;
      const cs = getComputedStyle(el);
      return { fontSize: cs.fontSize, maxWidth: cs.maxWidth, marginLeft: cs.marginLeft, marginRight: cs.marginRight };
    });

    expect(p.fontSize, 'hero subtitle size (1.25rem/20px) must not reach a demo').toBe('16px');
    expect(p.maxWidth, 'the hero 600px cap must not reach a demo').toBe('none');
    expect(p.marginLeft, 'no auto-centring inside a demo').toBe('0px');
    expect(p.marginRight, 'no auto-centring inside a demo').toBe('0px');
  });

  test('a demo heading uses the site h1 size, not the hero 3rem', async ({ page }) => {
    await showDetailsDemo(page);
    const size = await page.evaluate(() => {
      const stage = document.getElementById('behaviors-live-stage')!;
      const h1 = document.createElement('h1');
      h1.textContent = 'probe';
      stage.appendChild(h1);
      const fs = getComputedStyle(h1).fontSize;
      h1.remove();
      return fs;
    });
    expect(size, 'hero h1 (3rem/48px) must not reach a demo').toBe('40px');
  });
});
