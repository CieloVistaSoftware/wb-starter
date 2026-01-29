import { test, expect } from '@playwright/test';

test.describe('Builder startup smoke (fast)', () => {
  test('emits canonical loader messages and no overwrite-detection for DBC-protected fns', async ({ page }) => {
    const msgs: string[] = [];
    page.on('console', m => msgs.push(`${m.type()}: ${m.text()}`));

    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');

    // Wait briefly to collect startup logs
    await page.waitForTimeout(250);

    // 1) canonical loader messages (in order)
    const idxContracts = msgs.findIndex(m => m.includes('[BuilderContracts] ✅ Design by Contract utilities loaded'));
    const idxState = msgs.findIndex(m => m.includes('[BuilderState] ✅ Initialized with Design by Contract'));
    const idxHtmlEditor = msgs.findIndex(m => m.includes('[BuilderHtmlEditor] ✅ Loaded'));
    expect(idxContracts).toBeGreaterThanOrEqual(0);
    expect(idxState).toBeGreaterThanOrEqual(0);
    expect(idxHtmlEditor).toBeGreaterThanOrEqual(0);
    expect(idxContracts).toBeLessThan(idxState);
    expect(idxState).toBeLessThan(idxHtmlEditor);

    // 2) Ensure overwrite-detection does NOT warn about the known DBC-protected fns
    const hasOverwriteDetection = msgs.some(m => m.includes('OVERWRITE DETECTION'));
    if (hasOverwriteDetection) {
      // If overwrite-detection appears, ensure it does NOT list the protected names
      const forbidden = ['toggleXBehavior', 'updateBehaviorValue', 'addComponentToCanvas', 'deleteComponent', 'selectComponent', 'updateElementTheme'];
      const warnMsgs = msgs.filter(m => m.includes('OVERWRITE DETECTION'));
      for (const w of warnMsgs) {
        for (const name of forbidden) {
          expect(w).not.toContain(name);
        }
      }
    }

    // 3) Sanity: critical APIs exist
    const apis = await page.evaluate(() => ({
      addComponentToCanvas: typeof window.addComponentToCanvas,
      BuilderState: typeof window.BuilderState,
      toggleXBehavior: typeof window.toggleXBehavior
    }));

    expect(apis.BuilderState).toBe('object');
    expect(apis.addComponentToCanvas).toBe('function');
    expect(apis.toggleXBehavior).toBe('function');
  });
});
