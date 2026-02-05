import { test, expect } from '@playwright/test';

test.describe('Issues viewer — refresh behavior', () => {
  test('refresh updates issues panel after component is fixed', async ({ page }) => {
    console.log('STEP: navigate to builder');
    await page.goto('/builder.html');

    // Wait for the canvas and a known test component (used by other builder tests)
    const comp = page.locator('#empty-card');
    await expect(comp).toBeVisible({ timeout: 5000 });
    console.log('FOUND: #empty-card on canvas');

    // Select the component to show properties/issues
    await comp.click();
    await expect(page.locator('#propsPanel')).toBeVisible();
    console.log('PROPS: props panel visible');

    // Ensure issues panel appears for the placeholder component
    const issuesLocator = page.locator('#propsIssues .issue-item');
    await expect(issuesLocator.first()).toBeVisible({ timeout: 3000 });
    const beforeCount = await issuesLocator.count();
    console.log(`INITIAL ISSUES: ${beforeCount}`);

    // Simulate user fixing the component (add required `title`) and trigger refresh
    await page.evaluate(() => {
      const el = document.getElementById('empty-card');
      if (!el) return;
      // Set dataset.c to a minimal valid payload the analyzer expects
      el.dataset.c = JSON.stringify({ b: 'card', d: { title: 'Fixed by test' } });
      // Re-dispatch selection to force panel refresh (mirrors user flow)
      window.selComp && window.selComp(el);
    });

    console.log('ACTION: applied fix to #empty-card and triggered refresh');

    // Wait for issues panel to update (should remove issue items)
    await expect(page.locator('#propsIssues .issue-item')).toHaveCount(0, { timeout: 3000 });
    console.log('RESULT: issues panel refreshed — no remaining issue items');
  });
});
