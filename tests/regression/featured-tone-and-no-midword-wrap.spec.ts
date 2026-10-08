import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * #998 -- John: "featured should take a string to indicate what is featured,
 * or why. Then we need ability to change color at will."
 *
 * The string half shipped with #886 (featured="Deal of the week"). The colour
 * half is featuredTone: a theme ROLE (primary, success, warning, danger,
 * info, neutral) that resolves to that theme's variable, so the marker reads
 * correctly in every theme and no colour literal enters the markup. Any
 * other colour: --x-featured-bg in the page's stylesheet.
 *
 * Also from #998: the marker broke mid-word ("FEATURE" / "D") at narrow
 * widths. It must wrap only between words.
 */
const TONES = { primary: '--primary', success: '--success-color', warning: '--warning-color', danger: '--danger-color', info: '--info-color', neutral: '--secondary' } as const;

test('featuredTone paints the marker with each role\'s theme colour; --x-featured-bg overrides', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(async (tones) => {
    const host = document.createElement('div');
    host.style.cssText = 'width:600px';
    host.innerHTML = Object.keys(tones).map((t) =>
      `<article id="t-${t}" featured="Editor's pick" featured-tone="${t}" title="T">x</article>`).join('')
      + `<article id="t-custom" featured style="--x-featured-bg: rgb(1, 2, 3)" title="T">x</article>`;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, TONES);
  await settlePage(page, { timeout: 10000 });
  const got = await page.evaluate((tones) => {
    // The colour each role variable resolves to in this theme, measured the
    // same way the browser measures the marker.
    const probe = document.createElement('i');
    document.body.appendChild(probe);
    const resolve = (v: string) => { probe.style.background = `var(${v})`; return getComputedStyle(probe).backgroundColor; };
    const out: Record<string, { mark: string; expected: string; text: string }> = {};
    for (const [t, v] of Object.entries(tones)) {
      const mark = document.querySelector(`#t-${t} > header > mark`) as HTMLElement;
      out[t] = { mark: mark ? getComputedStyle(mark).backgroundColor : '(no marker)', expected: resolve(v), text: mark?.textContent?.trim() || '' };
    }
    const custom = document.querySelector('#t-custom > header > mark') as HTMLElement;
    out.custom = { mark: custom ? getComputedStyle(custom).backgroundColor : '(no marker)', expected: 'rgb(1, 2, 3)', text: custom?.textContent?.trim() || '' };
    return out;
  }, TONES);
  for (const [tone, r] of Object.entries(got)) {
    expect(r.mark, `${tone}: marker background`).toBe(r.expected);
  }
  expect(got.success.text).toBe("Editor's pick");
  expect(got.custom.text).toBe('Featured');
  // The roles must actually differ, or the attribute does nothing visible.
  expect(new Set(Object.values(got).map((r) => r.mark)).size).toBeGreaterThanOrEqual(5);
});

test('the marker never breaks inside a word, however narrow the card', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(async () => {
    const host = document.createElement('div');
    host.style.cssText = 'width:120px';
    host.innerHTML = '<article id="narrow" featured title="Ridge loop">x</article>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  });
  await settlePage(page, { timeout: 10000 });
  const r = await page.evaluate(() => {
    const mark = document.querySelector('#narrow > header > mark') as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(mark);
    return { lines: range.getClientRects().length, text: mark.textContent };
  });
  expect(r.text).toBe('Featured');
  expect(r.lines, 'a one-word marker renders on one line').toBe(1);
});
