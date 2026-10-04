import { test, expect, Page } from '../fixtures/offline';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  await page.evaluate(() => document.querySelector('.x-toast-container')?.remove());
}

test.describe('site-wide click confirmation (#456)', () => {
  test('confirms native buttons and clickable cards without intercepting anchors', async ({ page }) => {
    await loadPage(page);
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'click-confirm-button';
      button.textContent = 'Save';

      const card = document.createElement('div');
      card.id = 'click-confirm-card';
      card.className = 'x-card--clickable';
      card.textContent = 'Open card';

      const link = document.createElement('a');
      link.id = 'click-confirm-link';
      link.href = '#click-confirm-target';
      link.textContent = 'Navigate';

      document.body.append(button, card, link);
    });

    // Each click is checked by ITS OWN toast, not by the total on the page:
    // confirmation toasts dismiss themselves after 2s, so on a slow runner
    // the first one is gone before the third click is checked (CI, PR #1228).
    const toastFor = (id: string) => page.locator('.x-toast', { hasText: `Clicked: ${id}` });

    await page.locator('#click-confirm-button').click();
    await expect(toastFor('click-confirm-button')).toHaveCount(1);

    await page.locator('#click-confirm-card').click();
    await expect(toastFor('click-confirm-card')).toHaveCount(1);

    await page.locator('#click-confirm-link').click();
    await expect(page).toHaveURL(/#click-confirm-target$/);
    // The confirmation is deferred one tick (click-confirm.js); give it that
    // tick, then require that the anchor raised none.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
    await expect(page.locator('.x-toast', { hasText: /Clicked: (click-confirm-link|Navigate)/ })).toHaveCount(0);
  });

  test('a warning button gives a warning toast, not the default info (#1193)', async ({ page }) => {
    await loadPage(page);
    // Real path: the schema builder turns variant="warning" into the
    // x-button--warning class and drops the attribute, so the toast can only
    // learn the variant from that class. Wait for the class before clicking.
    await page.evaluate(async () => {
      const host = document.createElement('div');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'click-confirm-warning';
      button.setAttribute('variant', 'warning');
      button.textContent = 'Careful';
      host.append(button);
      document.body.append(host);
      await (window as any).WB.scan(host, { eager: true });
    });
    const button = page.locator('#click-confirm-warning');
    await expect(button).toHaveClass(/\bx-button--warning\b/);
    // A scan this direct keeps the attribute, but on rendered pages it is gone
    // and only the class carries the variant (click-confirm.js's own note).
    // Drop it so the toast must read the class, the path #1193 broke.
    await button.evaluate((el) => el.removeAttribute('variant'));
    await button.click();
    const toast = page.locator('.x-toast', { hasText: 'Clicked: click-confirm-warning' });
    await expect(toast).toHaveCount(1);
    // Read once: the toast dismisses itself after 2s, so a retrying
    // assertion would end on "not found" instead of naming the wrong variant.
    expect(await toast.getAttribute('class')).toMatch(/\bx-toast--warning\b/);
  });

  test('no source file looks for a retired wb-*--variant class (#1193)', async () => {
    // 4.0.0 renamed every wb- class to x-, but a regex or selector that builds
    // or matches a wb-name--modifier is not a class name, so the rename left
    // it behind and it silently never matched.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const retired = /wb-(\\w|\[\\w)[^'"\s]*--/;
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith('.js')) {
          fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
            if (retired.test(line)) hits.push(p.split(path.sep).join('/') + ':' + (i + 1));
          });
        }
      }
    };
    walk('src');
    expect(hits, 'retired wb-*--variant patterns').toEqual([]);
  });

  test('does not duplicate an explicit x-toast confirmation', async ({ page }) => {
    await loadPage(page);
    // The Behaviors page is a catalogue now (#666): an x-toast trigger only
    // exists once its row is picked, so this used to wait out the timeout on a
    // button that was never there. A query opens the collapsed group (#995).
    await expect(page.locator('.behaviors-search-results__row').first()).toBeVisible({ timeout: 25000 });
    await page.locator('#behaviors-search').fill('x-toast');
    const row = page.locator('.behaviors-search-results__row[data-browse-token="x-toast"][data-variant="success"]').first();
    await row.scrollIntoViewIfNeeded();
    await row.click();
    const button = page.locator('#behaviors-live [x-toast][toast-variant="success"]').first();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toHaveAttribute('x-ready', '', { timeout: 10000 });
    // The row click is a plain button, so it raised its own confirmation.
    await page.evaluate(() => document.querySelectorAll('.x-toast').forEach((el) => el.remove()));
    await button.click();
    await expect(page.locator('.x-toast--success')).toHaveCount(1);
    await expect(page.locator('.x-toast')).toHaveCount(1);
  });
});