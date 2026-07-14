import { test, expect } from '@playwright/test';

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

    // 2. Check that Modern component processed. card() (card.js) — the real
    // behavior that owns <wb-card>'s DOM — always adds the 'wb-card' class;
    // 'x-schema' was only ever set by schema-driven buildStructure(), which
    // <wb-card> (and the rest of the card family) no longer goes through at
    // all now that a tag with a real behavior never gets schema-processed
    // (#279 — the schema/behavior double-build race that broke cardimage/
    // cardvideo). 'wb-card' is the reliable "was this actually processed"
    // signal regardless of which mechanism built it.
    const modernCard = page.locator('#modern-card');
    await expect(modernCard).toHaveClass(/wb-card/);

    // 3. Check that Legacy component is NOT processed/upgraded
    const legacyCard = page.locator('#legacy-card');

    // Should verify it has the error marker
    await expect(legacyCard).toHaveAttribute('x-error', 'legacy');

    // Should NOT have been upgraded by card() — no 'wb-card' class.
    const legacyClass = await legacyCard.getAttribute('class');
    expect(legacyClass || '').not.toMatch(/\bwb-card\b/);
  });
});
