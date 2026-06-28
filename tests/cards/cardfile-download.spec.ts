/**
 * wb-cardfile — clicking the card downloads the file.
 * The whole card is the click target (and keyboard-activatable); it triggers a
 * download of href (falling back to the filename), naming it after `filename`.
 */
import { test, expect, Page } from '@playwright/test';

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    (window as any).WB.scan(container);
  }, html);
  await page.locator('#test-container wb-cardfile.wb-card-file').first().waitFor({ state: 'attached', timeout: 10000 });
}

test.describe('wb-cardfile download', () => {
  test('clicking a file card downloads the file (named after filename)', async ({ page }) => {
    await inject(page, '<wb-cardfile filename="report.pdf" size="2.4 MB" type="pdf" href="/files/report.pdf"></wb-cardfile>');
    const card = page.locator('#test-container wb-cardfile');
    await expect(card).toHaveAttribute('role', 'button');

    const downloadPromise = page.waitForEvent('download');
    await card.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('report.pdf');
  });

  test('keyboard (Enter) on a focused file card downloads it', async ({ page }) => {
    await inject(page, '<wb-cardfile filename="archive.zip" size="15.7 MB" type="zip" href="/files/archive.zip"></wb-cardfile>');
    const card = page.locator('#test-container wb-cardfile');
    await expect(card).toHaveAttribute('tabindex', '0');

    const downloadPromise = page.waitForEvent('download');
    await card.focus();
    await card.press('Enter');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('archive.zip');
  });

  test('falls back to filename as the download URL when no href is given', async ({ page }) => {
    await inject(page, '<wb-cardfile filename="photo.jpg" size="856 KB" type="image"></wb-cardfile>');
    const card = page.locator('#test-container wb-cardfile');
    await expect(card).toHaveAttribute('role', 'button');

    const downloadPromise = page.waitForEvent('download');
    await card.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('photo.jpg');
  });
});
