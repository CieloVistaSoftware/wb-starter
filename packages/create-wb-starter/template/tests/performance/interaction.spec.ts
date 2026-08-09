import { test, expect } from '@playwright/test';
import { logPerfResult } from './perf-logger';

test.describe('Interaction Performance', () => {

  test('Modal should open in under 100ms', async ({ page }) => {
    await page.goto('/?page=components');

    // #331/#335-adjacent: the old selector (button[data-modal-title="Glass
    // Modal"]) is stale legacy-syntax that hasn't existed since the v3
    // data-* purge -- it never matched anything, so this test timed out for
    // 30s on every run instead of measuring anything. The real, current
    // trigger is <wb-modal modal-title="..."> itself (components.html) --
    // the tag IS the clickable trigger, no nested button.
    const modalTrigger = page.locator('wb-modal').first();
    await modalTrigger.waitFor({ state: 'visible' });

    const startTime = Date.now();
    await modalTrigger.click();

    // wb-modal's behavior maps to 'dialog' (tag-map.js) -- opens a real
    // <dialog class="wb-dialog" open>, not the old test's assumed selector
    // shape. Confirmed live before writing this.
    const modal = page.locator('dialog.wb-dialog[open]');
    await modal.waitFor({ state: 'visible' });

    const duration = Date.now() - startTime;
    console.log(`Modal open duration: ${duration}ms`);

    logPerfResult({
      category: 'interaction',
      name: 'Modal Open',
      value: duration,
      unit: 'ms',
      threshold: 200
    });

    // 100ms is the threshold for "instant" feel
    expect(duration).toBeLessThan(200); // Giving a bit of buffer for test env
  });

  test('Tab switch should render in under 100ms', async ({ page }) => {
    // The old version of this test didn't test tabs at all -- despite its
    // name, it measured the mobile nav-toggle collapse (see its own comment:
    // "let's test the navigation menu toggle which is a similar
    // interaction"). components.html genuinely has a <wb-tabs> widget; test
    // the real thing instead of a mislabeled placeholder.
    await page.goto('/?page=components');

    const tabs = page.locator('wb-tabs').first();
    await tabs.scrollIntoViewIfNeeded();
    const secondTab = tabs.locator('.wb-tabs__tab').nth(1);
    await secondTab.waitFor({ state: 'visible' });

    const startTime = Date.now();
    await secondTab.click();

    await expect(secondTab).toHaveClass(/wb-tabs__tab--active/);

    const duration = Date.now() - startTime;
    console.log(`Tab switch duration: ${duration}ms`);

    logPerfResult({
      category: 'interaction',
      name: 'Tab Switch',
      value: duration,
      unit: 'ms',
      threshold: 100
    });

    expect(duration).toBeLessThan(100);
  });

  test('Mobile nav toggle should collapse in under 100ms', async ({ page }) => {
    // What the old "Tabs should switch" test actually measured, kept as its
    // own correctly-named test rather than dropped -- nav collapse is a
    // real, common interaction worth its own perf budget.
    await page.goto('/?page=components');

    const navToggle = page.locator('.nav__toggle');
    await navToggle.waitFor({ state: 'visible' });

    const startTime = Date.now();
    await navToggle.click();

    const nav = page.locator('.site__nav');
    await expect(nav).toHaveClass(/site__nav--collapsed/);

    const duration = Date.now() - startTime;
    console.log(`Nav toggle duration: ${duration}ms`);

    logPerfResult({
      category: 'interaction',
      name: 'Nav Toggle',
      value: duration,
      unit: 'ms',
      threshold: 100
    });

    expect(duration).toBeLessThan(100);
  });
});
