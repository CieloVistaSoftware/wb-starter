import { test, expect } from '@playwright/test';

/**
 * label-demo schema validation must actually run.
 *
 * label.schema.json carries a custom `"schemaFor"` keyword. `new Ajv()` defaults to
 * strict mode, which throws "unknown keyword: schemaFor" — so the demo fell into its
 * catch branch and printed "Schema validation skipped (unresolved $ref): ... unknown
 * keyword: schemaFor" instead of a real result. Fix: `new Ajv({ strict: false })`.
 */
test.describe('label-demo schema validation (#label-schema)', () => {
  test('validation runs and is not skipped on an unknown keyword', async ({ page }) => {
    await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
    // ajv loads from CDN + the schema is fetched; give it time.
    await page.waitForTimeout(2500);
    const out = (await page.locator('#label-schema-validation pre').innerText().catch(() => '')).trim();
    expect(out, `validation output was: "${out}"`).not.toMatch(/skipped|unknown keyword/i);
    expect(out, `expected a real PASS/FAIL result, got: "${out}"`).toMatch(/Schema validation:\s*(PASS|FAIL)/);
  });
});
