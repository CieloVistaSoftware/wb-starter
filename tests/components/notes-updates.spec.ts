import { test, expect, Page } from '@playwright/test';

// This file previously drove the notes drawer via a stale selector
// (`buttonwb-sheet[data-title="My Notes"]`) that never matched anything real
// on pages/behaviors.html -- rewritten against the same self-contained
// injectNotes() pattern tests/components/notes.spec.ts uses, and against the
// current UI (searchable Lookup list, not a raw <pre> JSON dump).
const BASE_URL = '/demos/test-harness.html';

async function injectNotes(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = '<div x-notes></div>';
    document.body.appendChild(container);
  });
  await page.evaluate(async () => await (window as any).WB.scan(document.getElementById('test-container'), { eager: true }));
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    (document.querySelector('#test-container [x-notes]') as any).wbNotes.open();
  });
}

test.describe('Notes Behavior Updates', () => {
  test('Notes should show current URL on open', async ({ page }) => {
    await injectNotes(page);
    const textarea = page.locator('#test-container .x-notes__textarea');
    await expect(textarea).toBeVisible();
    const value = await textarea.inputValue();
    expect(value).toContain(page.url());
  });

  test('Saving a note should show a success status, and Lookup should find it', async ({ page }) => {
    await injectNotes(page);

    const textarea = page.locator('#test-container .x-notes__textarea');
    await textarea.fill('Test note content ' + Date.now());

    await page.click('#test-container button[data-action="save"]');
    const status = page.locator('#test-container .x-notes__status');
    await expect(status).toContainText('Saved');

    await page.click('#test-container button[data-action="view"]');
    const viewerHeading = page.locator('h3:has-text("Saved Notes")');
    await expect(viewerHeading).toBeVisible();

    const searchInput = page.locator('.x-notes__lookup-search');
    await expect(searchInput).toBeVisible();
    // The heading's own container (viewerContent) holds both the header and
    // the note-list body -- walk up to it rather than relying on a fragile
    // fixed number of `..` hops from a different element.
    const viewerContent = viewerHeading.locator('xpath=ancestor::div[3]');
    await expect(viewerContent).toContainText('Test note content');
  });
});
