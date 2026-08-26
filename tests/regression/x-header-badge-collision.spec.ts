import { test, expect, Page } from '@playwright/test';

/**
 * <header icon="🚀" title="App" badge="v1.0"> rendered TWO rocket-ship
 * icons instead of one. Root cause: src/core/semantic-attributes.js's bare
 * `[badge]` selector (SEMANTIC_PROPERTY_ATTRIBUTES -- lets any element opt
 * into feedback.js's badge() via a plain `badge="..."` attribute) matched
 * <header> too, since header.js only just gained its OWN badge handling
 * (renders it as a .x-tag-glass span in .x-header__right) -- exactly the
 * same collision the x-card family was already excluded for (see this
 * file's CARD_TAGS/CARD_TAG_EXCLUSIONS comment): the generic badge()
 * re-read the header's `icon` attribute and prepended its own
 * <span class="[x-badge]__icon">🚀</span> as the header's first child,
 * alongside header()'s own correctly-built <span class="x-header__icon">.
 * Fixed by adding '.x-header' to a badge-specific exclusion list (it has no
 * competing tooltip handling, so it stays included in the generic
 * `[tooltip]` mapping).
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const existing = document.getElementById('header-badge-test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'header-badge-test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
  }, html);
  await page.waitForTimeout(300);
}

test.describe('.x-header + badge attribute: no collision with the generic [badge] semantic property', () => {
  test('icon/title/badge together render exactly one icon, not two', async ({ page }) => {
    await inject(page, `<header id="h1" icon="🚀" title="App" badge="v1.0"></header>`);

    const header = page.locator('#h1');
    await expect(header.locator('.x-header__icon')).toHaveCount(1);
    await expect(header.locator('.x-header__icon')).toHaveText('🚀');
    // The generic badge() behavior's own icon-prepend must NOT have fired.
    await expect(header.locator('.x-badge__icon')).toHaveCount(0);
  });

  test('does not pick up [x-badge]/x-badge--* classes on the header root', async ({ page }) => {
    await inject(page, `<header id="h2" icon="🚀" title="App" badge="v1.0"></header>`);

    const header = page.locator('#h2');
    await expect(header).not.toHaveClass(/\bwb-badge\b/);
    // badge()'s own variant fallback (`element.getAttribute('badge')` used
    // as a variant name when no `variant` attribute is present) would have
    // added this exact garbage class if the collision were still live.
    await expect(header).not.toHaveClass(/x-badge--v1\.0/);
  });

  test('badge value still renders correctly via the header\'s own .x-tag-glass', async ({ page }) => {
    await inject(page, `<header id="h3" icon="🚀" title="App" badge="v1.0"></header>`);

    await expect(page.locator('#h3 .x-tag-glass')).toHaveText('v1.0');
    await expect(page.locator('#h3 .x-header__title')).toHaveText('App');
  });

  test('a real standalone [x-badge] elsewhere on the page is unaffected', async ({ page }) => {
    await inject(page, `
      <header id="h4" icon="🚀" title="App" badge="v1.0"></header>
      <span x-badge id="b1" icon="🟢">Live</span>
    `);

    await expect(page.locator('#b1')).toHaveClass(/x-badge\b/);
    await expect(page.locator('#b1 .x-badge__icon')).toHaveText('🟢');
  });

  test('.x-header without a competing tooltip implementation still gets the generic themed tooltip', async ({ page }) => {
    await inject(page, `<header id="h5" title="Hover me" tooltip="A real tooltip"></header>`);

    const header = page.locator('#h5');
    await header.hover();
    await expect(page.locator('.x-tooltip', { hasText: 'A real tooltip' })).toBeVisible({ timeout: 3000 });
  });
});
