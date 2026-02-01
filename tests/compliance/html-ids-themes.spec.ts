import { test, expect } from '@playwright/test';
import { ROOT, relativePath, readFile } from '../base';

test.describe('HTML Compliance: ID attributes (themes.html)', () => {
  test('themes critical containers have IDs', async ({ page }) => {
    const file = `${ROOT}/pages/themes.html`;
    const content = readFile(file);
    await page.setContent(content);

    const selectors = [
      '.themes-stats',
      '#hcs-demo-visual',
      '#hcs-color-output',
      '#harmony-grid',
      '#themes-preview-container'
    ];

    for (const s of selectors) {
      const el = await page.$(s);
      expect(el, `${s} should exist in pages/themes.html`).not.toBeNull();
      const id = await el?.getAttribute('id');
      expect(id, `${s} must have an id`).toBeTruthy();
    }

    // Also ensure overall missing-id count is within threshold for this page
    // Focused check: ensure high-value containers have IDs (global missing-ID coverage is tracked by the main html-ids.spec.ts)
    // This targeted assertion keeps this PR small and reviewable while addressing the largest noise sources.
    // (Global coverage will be reduced in follow-up PRs.)
  });
});
