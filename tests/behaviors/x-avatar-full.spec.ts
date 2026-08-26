import { test, expect, Page, Locator } from '@playwright/test';

/**
 * x-avatar — every declared parameter, proven.
 *
 * John: "doesn't work the shape is not right? now write tests for all x-avatar
 * and make sure everything works."
 *
 * avatar.schema.json declares eight parameters. This asserts each one changes
 * something observable, because "declared in the schema" has repeatedly turned
 * out not to mean "implemented" — #861 measured 154 such attributes across 47
 * behaviors that are documented, shown in the showcase, and inert.
 *
 * WHY THIS BEHAVIOR IS STYLED THE WAY IT IS
 *
 * feedback.js's avatar() says it outright: "CSS targets <span x-avatar> tag and
 * attributes directly. JS only creates child elements." So size/shape/status
 * are attribute selectors in avatar.css — `[x-avatar][shape="square"]` — not
 * classes the behavior adds. Assertions therefore check COMPUTED STYLE, not
 * class names: a class assertion would pass while the rule behind it was
 * unreachable, which is exactly how the shape bug survived.
 *
 * THE SHAPE BUG THAT PROMPTED THIS
 *
 * avatar.css had 15 rules written as `sel { … }, sel2 { … }` — a selector list
 * cannot resume after a closed block, so every parser dropped the remainder.
 * The half that survived was `x-avatar[shape="square"]`, a TAG selector for a
 * tag 4.0.0 removed. Both halves were therefore dead and every avatar rendered
 * at the default 40px circle regardless of size or shape. Repaired; these tests
 * exist so it cannot come back silently.
 */

const SRC = 'https://picsum.photos/seed/ada/64/64';

/** Mount markup, scan it, and return the probe host. */
async function mount(page: Page, html: string): Promise<Locator> {
  await page.evaluate(async (markup: string) => {
    document.getElementById('av-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'av-probe';
    host.innerHTML = markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host);
  }, html);
  const host = page.locator('#av-probe');
  await expect(host.locator('[x-avatar]').first()).toBeVisible({ timeout: 10000 });
  return host;
}

const radius = (l: Locator) => l.evaluate((el) => getComputedStyle(el).borderRadius);
const boxW = (l: Locator) => l.evaluate((el) => Math.round(el.getBoundingClientRect().width));

test.describe('x-avatar: every declared parameter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });
  });

  // ---- shape --------------------------------------------------------------

  test('shape="square" renders square corners', async ({ page }) => {
    const host = await mount(page, `<div id="a" shape="square" x-avatar src="${SRC}" name="Ada" size="lg"></div>`);
    expect(
      await radius(host.locator('#a')),
      'shape="square" left the avatar rounded. avatar.css targets '
      + '[x-avatar][shape="square"]; if that rule is unreachable the element '
      + 'falls back to the default circle.',
    ).toBe('0px');
  });

  test('shape="rounded" renders partly rounded corners', async ({ page }) => {
    const host = await mount(page, `<div id="a" shape="rounded" x-avatar src="${SRC}" name="Ada" size="lg"></div>`);
    expect(await radius(host.locator('#a'))).toBe('20%');
  });

  test('shape defaults to a circle', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar src="${SRC}" name="Ada"></div>`);
    expect(await radius(host.locator('#a'))).toBe('50%');
  });

  // ---- size ---------------------------------------------------------------

  test('every size renders a distinct, increasing box', async ({ page }) => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const host = await mount(
      page,
      sizes.map((s) => `<div id="s-${s}" size="${s}" x-avatar src="${SRC}" name="Ada"></div>`).join(''),
    );

    const widths: number[] = [];
    for (const s of sizes) widths.push(await boxW(host.locator(`#s-${s}`)));

    // Distinct AND ordered. Equal widths mean the size rules are unreachable —
    // which is precisely what the malformed-CSS bug produced (every avatar
    // 40px), and a "renders at some size" assertion would have passed through it.
    expect(
      new Set(widths).size,
      `sizes produced ${JSON.stringify(Object.fromEntries(sizes.map((s, i) => [s, widths[i]])))} — `
      + 'every size must differ, or the size rules are not reaching the element.',
    ).toBe(sizes.length);

    for (let i = 1; i < widths.length; i++) {
      expect(widths[i], `${sizes[i]} is not larger than ${sizes[i - 1]}`).toBeGreaterThan(widths[i - 1]);
    }
  });

  // ---- src / initials / name ---------------------------------------------

  test('src renders a real <img>', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar src="${SRC}" name="Ada"></div>`);
    await expect(host.locator('#a img')).toHaveAttribute('src', SRC);
  });

  test('initials render when there is no src', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar initials="AL" name="Ada Lovelace"></div>`);
    await expect(host.locator('#a')).toHaveText('AL');
    expect(await host.locator('#a img').count(), 'no src, so no <img> should be built').toBe(0);
  });

  test('name derives initials when initials are not given', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar name="Ada Lovelace"></div>`);
    await expect(host.locator('#a')).toHaveText('AL');
  });

  test('initials win over a derived name', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar initials="ZZ" name="Ada Lovelace"></div>`);
    await expect(host.locator('#a')).toHaveText('ZZ');
  });

  // ---- alt ----------------------------------------------------------------

  test('alt sets the image alt text', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="a" x-avatar src="${SRC}" alt="Portrait of Ada Lovelace" name="Ada Lovelace"></div>`,
    );
    await expect(
      host.locator('#a img'),
      'alt is declared in avatar.schema.json but avatar() sets img.alt = name, '
      + 'discarding it. A caller who writes a considered alt gets the name '
      + 'instead — and the two are different things: the name is who, alt is '
      + 'what the image shows.',
    ).toHaveAttribute('alt', 'Portrait of Ada Lovelace');
  });

  // ---- status -------------------------------------------------------------

  for (const status of ['online', 'offline', 'busy', 'away']) {
    test(`status="${status}" renders its own indicator`, async ({ page }) => {
      const host = await mount(page, `<div id="a" status="${status}" x-avatar src="${SRC}" name="Ada"></div>`);
      const dot = host.locator(`#a .x-avatar__status--${status}`);
      await expect(dot).toHaveCount(1);
      // A dot with no size or colour is not an indicator.
      const painted = await dot.evaluate((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), bg: cs.backgroundColor };
      });
      expect(painted.w, `the ${status} dot has no width`).toBeGreaterThan(0);
      expect(painted.bg, `the ${status} dot has no background colour`).not.toBe('rgba(0, 0, 0, 0)');
    });
  }

  test('no status renders no indicator', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar src="${SRC}" name="Ada"></div>`);
    expect(await host.locator('#a [class*="x-avatar__status"]').count()).toBe(0);
  });

  // ---- bordered -----------------------------------------------------------

  test('bordered draws a visible border', async ({ page }) => {
    const host = await mount(page, `<div id="a" bordered x-avatar src="${SRC}" name="Ada"></div>`);
    const width = await host.locator('#a').evaluate((el) => getComputedStyle(el).borderWidth);
    expect(
      width,
      'bordered is declared in avatar.schema.json and the modifier class is '
      + 'applied, but avatar.css contains no rule for it — grep "bordered" in '
      + 'that file returns nothing. The attribute is inert.',
    ).not.toBe('0px');
  });

  test('an avatar without bordered has no border', async ({ page }) => {
    const host = await mount(page, `<div id="a" x-avatar src="${SRC}" name="Ada"></div>`);
    expect(await host.locator('#a').evaluate((el) => getComputedStyle(el).borderWidth)).toBe('0px');
  });
});
