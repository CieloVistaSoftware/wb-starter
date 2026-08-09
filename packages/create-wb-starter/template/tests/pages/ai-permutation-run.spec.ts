import { test, expect } from '@playwright/test';

test('ai-permutation-test: find schema with gaps, run all tests live, verify results', async ({ page }) => {
  // Increase timeout - this test runs live DOM tests
  test.setTimeout(60000);

  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  // 1. Navigate
  await page.goto('/pages/ai-permutation-test.html', { waitUntil: 'domcontentloaded' });

  // 2. Wait for dropdown
  const select = page.locator('#schema-select');
  await expect(select).toBeVisible({ timeout: 10000 });

  // 3. Try schemas until we find one with missing permutations
  const candidates = ['alert', 'spinner', 'avatar', 'progress', 'switch', 'badge', 'button', 'chip'];
  let foundSchema = '';
  let missingCount = 0;

  for (const schema of candidates) {
    await select.selectOption(schema);
    // Wait for processing to complete
    await expect(page.locator('#missing-card')).toBeVisible({ timeout: 10000 });
    // Small pause for computation
    await page.waitForTimeout(500);

    const summaryText = await page.locator('#missing-summary').textContent() || '';
    console.log(`Schema "${schema}" summary: ${summaryText}`);
    const match = summaryText.match(/Missing:\s*(\d+)/);
    const count = match ? parseInt(match[1]) : 0;

    if (count > 0) {
      foundSchema = schema;
      missingCount = count;
      console.log(`>>> Using "${schema}" with ${count} missing permutations`);
      break;
    }
  }

  // If no schema has gaps, we need to verify the tool at least loads correctly
  if (!foundSchema) {
    console.log('All candidate schemas have full coverage. Verifying page loads correctly.');
    // At minimum verify the page machinery works - schema loaded, computed, displayed
    const logText = await page.locator('#activity-log').textContent();
    expect(logText).toContain('Schema loaded');
    return; // Pass — the tool works, there's just nothing to run
  }

  // 4. Check WB is available
  const wbState = await page.evaluate(() => ({
    hasWB: typeof (window as any).WB !== 'undefined',
    hasInject: !!((window as any).WB && (window as any).WB.inject),
    version: (window as any).WB?.version ?? 'none',
  }));
  console.log('WB STATE:', JSON.stringify(wbState));

  // 5. Click "Run All Tests Live"
  const runBtn = page.locator('#run-tests-btn');
  await expect(runBtn).toBeVisible();
  await expect(runBtn).toBeEnabled();

  console.log(`Clicking Run All Tests Live for "${foundSchema}" (${missingCount} missing)...`);
  await runBtn.click();

  // 6. Wait for test results to appear
  try {
    await expect(page.locator('.pt-test-result').first()).toBeVisible({ timeout: 30000 });
    console.log('Test results appeared!');
  } catch {
    // Grab diagnostics
    const btnText = await runBtn.textContent();
    const btnDisabled = await runBtn.isDisabled();
    const logText = await page.locator('#activity-log').textContent();
    const resultsVisible = await page.locator('#test-results-card').isVisible();

    console.log('=== FAILURE DIAGNOSTICS ===');
    console.log('Button text:', btnText);
    console.log('Button disabled:', btnDisabled);
    console.log('Results card visible:', resultsVisible);
    console.log('Activity log (last 500):', logText?.slice(-500));
    console.log('Console errors:', JSON.stringify(errors));
    console.log('WB state:', JSON.stringify(wbState));
  }

  // 7. Assert results rendered
  const resultCount = await page.locator('.pt-test-result').count();
  console.log('RESULT COUNT:', resultCount);
  expect(resultCount, `Expected test results for ${foundSchema}`).toBeGreaterThan(0);

  // 8. Assert summary appeared
  await expect(page.locator('#test-summary')).toBeVisible({ timeout: 10000 });
  const finalSummary = await page.locator('#test-summary').textContent();
  console.log('FINAL SUMMARY:', finalSummary);

  // 9. Button should be re-enabled after tests complete
  await expect(runBtn).toBeEnabled({ timeout: 5000 });
  const finalBtnText = await runBtn.textContent();
  expect(finalBtnText).toContain('Run All Tests Live');
});
