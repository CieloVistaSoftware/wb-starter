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
    
    // Give it a moment for logs to appear
    await page.waitForTimeout(500);

    // 1. Check for Console Error
    // Should match "Legacy syntax data-wb="card" detected..."
    const legacyErrorMatch = errorLogs.find(log => log.includes('Legacy syntax') && log.includes('data-wb="card"'));

    expect(legacyErrorMatch, 'Should log error for legacy syntax').toBeTruthy();

    // 2. Check that Modern component processed
    const modernCard = page.locator('#modern-card');
    await expect(modernCard).toHaveAttribute('x-schema', 'card');

    // 3. Check that Legacy component is NOT processed/upgraded
    const legacyCard = page.locator('#legacy-card');
    
    // Should verify it has the error marker
    await expect(legacyCard).toHaveAttribute('x-error', 'legacy');
    
    // Should NOT have the success marker
    const isLegacyProcessed = await legacyCard.getAttribute('x-schema');
    expect(isLegacyProcessed).toBeNull();
  });
});
