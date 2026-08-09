/**
 * REGRESSION: demos/site/content.html gated the native <dialog> demo's
 * "Open Modal Dialog" button behind a hasRequiredPadding() check that read
 * window.getComputedStyle(document.body)'s own padding -- but the page's
 * actual layout padding is applied to a nested `body > .page` wrapper
 * (`body > .page { padding: var(--space-xl); }`), never to <body> itself.
 * document.body's own padding is always 0, so the gate could never pass --
 * clicking the button always showed the "Modal blocked" warning instead of
 * opening the dialog, no matter what.
 */
import { test, expect } from '@playwright/test';

test('clicking "Open Modal Dialog" actually opens the native dialog', async ({ page }) => {
  await page.goto('/demos/site/content.html');
  await page.waitForSelector('#open-dialog-btn', { state: 'visible' });

  const dialog = page.locator('#demo-dialog');
  await expect(dialog).not.toHaveAttribute('open', '');

  await page.locator('#open-dialog-btn').click();

  await expect(dialog).toHaveAttribute('open', '');
  await expect(page.locator('#padding-warning')).not.toHaveClass(/show/);
});
