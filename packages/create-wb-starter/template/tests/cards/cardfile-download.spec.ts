/**
 * x-cardfile — clicking the card downloads the file.
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
  await page.locator('#test-container x-cardfile.x-card-file').first().waitFor({ state: 'attached', timeout: 10000 });
}

test.describe('x-cardfile download', () => {
  test('clicking a file card downloads the file (named after filename)', async ({ page }) => {
    await inject(page, '<div x-cardfile filename="report.pdf" size="2.4 MB" type="pdf" href="/files/report.pdf"></div>');
    const card = page.locator('#test-container x-cardfile');
    await expect(card).toHaveAttribute('role', 'button');

    const downloadPromise = page.waitForEvent('download');
    await card.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('report.pdf');
  });

  test('keyboard (Enter) on a focused file card downloads it', async ({ page }) => {
    await inject(page, '<div x-cardfile filename="archive.zip" size="15.7 MB" type="zip" href="/files/archive.zip"></div>');
    const card = page.locator('#test-container x-cardfile');
    await expect(card).toHaveAttribute('tabindex', '0');

    const downloadPromise = page.waitForEvent('download');
    await card.focus();
    await card.press('Enter');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('archive.zip');
  });

  test('is not downloadable/clickable when no href is given', async ({ page }) => {
    // filename is a DISPLAY label ("Sample filename"), not a URL -- using it
    // as a fallback href made `a.href` resolve as a relative path against
    // the current page, so every card with no real href downloaded the
    // current page itself (named after `filename` but actually HTML
    // content, so the browser appended .htm to it). Confirmed live via
    // screenshot: a whole grid of demo file-type cards all downloading as
    // "Sample filename (N).htm". With no href there's nothing real to
    // download, so the card must not offer to.
    await inject(page, '<div x-cardfile filename="photo.jpg" size="856 KB" type="image"></div>');
    const card = page.locator('#test-container x-cardfile');
    await expect(card).not.toHaveAttribute('role', 'button');
    await expect(card).not.toHaveAttribute('tabindex', '0');
    await expect(card.locator('.x-card__file-download')).toHaveCount(0);
    // Silently doing nothing is confusing to whoever's authoring/testing
    // the card -- surface it visibly instead.
    await expect(card.locator('.x-card__file-warning')).toBeVisible();
    await expect(card.locator('.x-card__file-warning')).toHaveText(/no href/i);
  });

  test('file-type attribute (the schema-declared name) picks the matching icon', async ({ page }) => {
    // cardfile.schema.json declares this property as `fileType` (HTML attribute
    // file-type=, per project convention -- every real demo/doc author used
    // this spelling). The viewmodel only ever read the bare `type` attribute,
    // which no real markup sets, so every card silently fell back to the
    // generic file (📁) icon regardless of its declared file-type. Confirmed
    // live: demos/site/cards.html's "fileType variants" section showed the
    // identical folder icon for pdf/doc/image/video/audio/zip/file.
    await inject(page, '<div x-cardfile file-type="image" filename="photo.jpg" href="/files/photo.jpg"></div>');
    const icon = page.locator('#test-container x-cardfile > span').first();
    await expect(icon).toHaveText('🖼️');
  });
});
