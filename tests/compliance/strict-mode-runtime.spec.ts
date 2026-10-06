import { test, expect } from '../fixtures/offline';

test.describe('Strict Mode Runtime Compliance', () => {

  test('should throw error for legacy data-wb usage and NOT process it', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    await page.goto('/tests/compliance/legacy-syntax-check.html');
    
    // Wait for initialization
    await page.waitForFunction(() => (window as any).WB);
    
    // 1. Check for Console Error — poll until the runtime logs the legacy-syntax
    // error instead of a fixed 500ms wait that races the logging and flakes.
    // Should match "Legacy syntax data-wb="card" detected..."
    await expect.poll(
      () => errorLogs.find(log => log.includes('Legacy syntax') && log.includes('data-wb="card"')),
      { message: 'Should log error for legacy syntax', timeout: 5000 }
    ).toBeTruthy();

    // 2. Check that Modern component processed. card() (card.js) is the real
    // behavior that owns <article>'s DOM. It used to add an 'x-card' class
    // and this asserted that; a8a7362e stopped stamping it (card.css matches
    // the tag), so the class is gone by design. x-ready is the completion
    // signal both runtimes emit per element (ready-signal.js, stamped under
    // automation) -- "was this actually processed", whatever built it.
    const modernCard = page.locator('#modern-card');
    await expect(modernCard).toHaveAttribute('x-ready', '');

    // 3. Check that Legacy component is NOT processed/upgraded
    const legacyCard = page.locator('#legacy-card');

    // Should verify it has the error marker
    await expect(legacyCard).toHaveAttribute('x-error', 'legacy');

    // Should NOT have been upgraded by card(). This compared the class
    // against /wb-card/, a name nothing has emitted since the x- prefix, so it
    // could not fail. x-ready cannot answer it either: the x-error marker is
    // itself the x-error behavior's attribute, so the element does settle.
    // What card() leaves behind is structure -- it moves loose content into
    // a <main> (the modern card below proves the probe can see it).
    await expect(modernCard.locator(':scope > .x-card__body')).toHaveText('Modern Content');
    await expect(legacyCard.locator(':scope > .x-card__body')).toHaveCount(0);
    await expect(legacyCard).toHaveText('Legacy Content');
  });
});
