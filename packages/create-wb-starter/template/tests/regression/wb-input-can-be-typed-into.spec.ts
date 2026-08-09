/**
 * REGRESSION: <wb-input> is declared as a schema-driven host in
 * input.schema.json's $view -- but that $view is only ever interpreted by
 * schema-builder.js's processElement(), which the EAGER runtime (wb.js,
 * main SPA) calls generically for every wb-* element. The LAZY runtime
 * (wb-lazy.js, used by every standalone demos/site/*.html page) never
 * calls processSchema at all. semantics/input.js's WB-INPUT branch used to
 * just no-op (#367), assuming the schema "already does everything" -- true
 * only under the eager runtime. Under the lazy runtime this left every
 * <wb-input> on every demos/site/*.html page completely unbuilt: no real
 * <input> child at all, just the host tag's raw attribute-dump text
 * content -- confirmed live, nothing to type into, on all 32 instances on
 * forms.html alone.
 */
import { test, expect } from '@playwright/test';

test('every non-disabled, non-readonly wb-input on forms.html has a real, typeable <input>', async ({ page }) => {
  await page.goto('/demos/site/forms.html');
  await page.waitForTimeout(1500);

  const wbInputs = page.locator('wb-input');
  const count = await wbInputs.count();
  expect(count, 'forms.html must have at least one wb-input to check').toBeGreaterThan(0);

  let checked = 0;
  let skippedDisabled = 0;

  for (let i = 0; i < count; i++) {
    const host = wbInputs.nth(i);
    const isDisabled = await host.evaluate(el => el.hasAttribute('disabled'));
    const isReadonly = await host.evaluate(el => el.hasAttribute('readonly'));

    const realInput = host.locator('input');
    await expect(realInput, `wb-input #${i} must render a real <input> child, not just raw attribute text`).toHaveCount(1);

    if (isDisabled || isReadonly) {
      skippedDisabled++;
      continue;
    }

    await realInput.click();
    await realInput.fill(`test-${i}`);
    await expect(realInput, `wb-input #${i}'s <input> must actually accept typed text`).toHaveValue(`test-${i}`);
    checked++;
  }

  expect(checked, 'at least one enabled wb-input must have been exercised').toBeGreaterThan(0);
  // Not a silent cap -- surface how many were intentionally skipped so a
  // reviewer can confirm that count matches the real disabled/readonly demo
  // instances on the page, not a detection bug hiding broken ones.
  console.log(`wb-input check: ${checked} typed into, ${skippedDisabled} skipped (disabled/readonly), ${count} total`);
});
