/**
 * REGRESSION: <div x-input> is declared as a schema-driven host in
 * input.schema.json's $view -- but that $view is only ever interpreted by
 * schema-builder.js's processElement(), which the EAGER runtime (wb.js,
 * main SPA) calls generically for every wb-* element. The LAZY runtime
 * (wb-lazy.js, used by every standalone demos/site/*.html page) never
 * calls processSchema at all. semantics/input.js's WB-INPUT branch used to
 * just no-op (#367), assuming the schema "already does everything" -- true
 * only under the eager runtime. Under the lazy runtime this left every
 * <div x-input> on every demos/site/*.html page completely unbuilt: no real
 * <input> child at all, just the host tag's raw attribute-dump text
 * content -- confirmed live, nothing to type into, on all 32 instances on
 * forms.html alone.
 */
import { test, expect } from '../fixtures/offline';

test('every non-disabled, non-readonly [x-input] on forms.html has a real, typeable <input>', async ({ page }) => {
  // 32 fields, each scrolled to, built and typed into: more than the default
  // 30s budget whenever the machine is busy.
  test.slow();
  await page.goto('/demos/site/forms.html');
  await page.waitForTimeout(1500);

  const wbInputs = page.locator('[x-input]');
  const count = await wbInputs.count();
  expect(count, 'forms.html must have at least one [x-input] to check').toBeGreaterThan(0);

  let checked = 0;
  let skippedDisabled = 0;

  for (let i = 0; i < count; i++) {
    const host = wbInputs.nth(i);
    // The lazy runtime (#491) builds a host only once it nears the viewport;
    // these demos sit far below the fold, so bring each one into view first,
    // the way a reader reaches it.
    // A plain scrollIntoView: scrollIntoViewIfNeeded() first waits for the
    // host to be "stable", and an unbuilt host is still being laid out.
    await host.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const isDisabled = await host.evaluate(el => el.hasAttribute('disabled'));
    const isReadonly = await host.evaluate(el => el.hasAttribute('readonly'));

    const realInput = host.locator('input');
    await expect(realInput, `[x-input] #${i} must render a real <input> child, not just raw attribute text`).toHaveCount(1);

    if (isDisabled || isReadonly) {
      skippedDisabled++;
      continue;
    }

    // number/date/time/datetime-local fields reject free text by design (the input-type
    // demos include each), so every field is given a value its type accepts.
    const type = (await realInput.getAttribute('type')) || 'text';
    const typed = ({ number: String(100 + i), date: '2026-01-15', time: '13:45', 'datetime-local': '2026-01-15T13:45' } as Record<string, string>)[type]
      ?? `test-${i}`;
    await realInput.click();
    await realInput.fill(typed);
    await expect(realInput, `x-input #${i}'s <input> must actually accept typed text`).toHaveValue(typed);
    checked++;
  }

  expect(checked, 'at least one enabled [x-input] must have been exercised').toBeGreaterThan(0);
  // Not a silent cap -- surface how many were intentionally skipped so a
  // reviewer can confirm that count matches the real disabled/readonly demo
  // instances on the page, not a detection bug hiding broken ones.
  console.log(`[x-input] check: ${checked} typed into, ${skippedDisabled} skipped (disabled/readonly), ${count} total`);
});
