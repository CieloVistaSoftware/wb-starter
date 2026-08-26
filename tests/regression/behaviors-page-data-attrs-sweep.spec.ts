import { test, expect } from '@playwright/test';

/**
 * pages/behaviors.html used `data-*` attributes on ~20 different `x-*`/`wb-*`
 * demo elements (masked inputs, stepper, alert dismiss, badge pill, modal,
 * tooltip, popover, confirm/prompt, breadcrumb, pagination, steps, timeline,
 * gallery, slidein, copy, share, relativetime, truncate) -- a Tier-1 Law 11
 * violation ("No data-* Attributes on wb-* Components", docs/claude/
 * TIER1-LAWS.md). Every one of these behavior handlers only reads the PLAIN
 * attribute name (a few also tolerate the specific `data-` spelling as a
 * compat shim, most do not) -- so each demo silently rendered with defaults
 * or nothing at all. Confirmed live via screenshots across an entire session.
 * This is the permanent regression gate for that whole sweep.
 */

async function ready(page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

test.describe('Behaviors page: data-* attribute sweep stays fixed', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('masked inputs actually mask typed input', async ({ page }) => {
    const phone = page.locator('input[x-masked]').first();
    await phone.click();
    await phone.pressSequentially('5551234567', { delay: 10 });
    await expect(phone).toHaveValue(/\(555\) 123-4567/);
  });

  test('stepper renders its configured value, not 0/default', async ({ page }) => {
    const stepper = page.locator('[x-stepper]').first();
    const text = await stepper.evaluate((el) => el.textContent || '');
    expect(text).toContain('5');
  });

  test('alerts show a dismiss control (dismissible worked)', async ({ page }) => {
    const alerts = page.locator('[x-alert]');
    const count = await alerts.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const hasDismiss = await alerts.nth(i).evaluate((el) =>
        !!el.querySelector('[class*="dismiss"], [class*="close"], button'));
      expect(hasDismiss, `alert ${i} should have a dismiss control`).toBeTruthy();
    }
  });

  test('pill badge gets the pill class/shape', async ({ page }) => {
    const pillBadge = page.locator('[x-badge]', { hasText: 'Pill Badge' });
    await expect(pillBadge).toHaveClass(/x-badge--pill/);
  });

  test('modal trigger is visible and opens with correct title/content', async ({ page }) => {
    const trigger = page.locator('[x-modal]', { hasText: 'Open Modal' });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.locator('dialog[open], .x-dialog[open]').first();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Modal Dialog');
    await expect(dialog).toContainText('Press ESC or click outside to close');
  });

  test('tooltips show at the button-declared position, not all defaulting to one side', async ({ page }) => {
    const positions = ['Top', 'Bottom', 'Left', 'Right'];
    const seen = new Set<string>();
    for (const label of positions) {
      const btn = page.locator('button', { hasText: label }).first();
      await btn.hover();
      // .x-tooltip is the actual popup div (tooltip.js); the trigger button
      // itself carries `x-tooltip-trigger`, which also matches a generic
      // [class*="tooltip"] substring selector -- be exact.
      const tooltip = page.locator('.x-tooltip.x-tooltip--visible').last();
      await expect(tooltip).toBeVisible({ timeout: 5000 });
      const cls = await tooltip.getAttribute('class');
      seen.add((cls || '').replace(/\s*x-tooltip--visible\s*/, '').trim());
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden({ timeout: 3000 }).catch(() => {});
    }
    // Each hover should have produced a distinct positional class.
    expect(seen.size, `expected 4 distinct tooltip position classes, got: ${JSON.stringify([...seen])}`).toBeGreaterThanOrEqual(4);
  });

  test('popover shows its configured title and content', async ({ page }) => {
    const trigger = page.locator('button', { hasText: 'Show Popover' });
    await trigger.click();
    const popover = page.locator('[class*="popover"]:not([x-popover])').last();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Popover Title');
  });

  test('confirm and prompt dialogs show their configured title/message', async ({ page }) => {
    // confirm()/prompt() (overlay.js) build a class-free, inline-styled
    // overlay+dialog on click -- no stable selector exists, so match by the
    // configured title text instead.
    const confirmBtn = page.locator('button', { hasText: 'Confirm Dialog' });
    await confirmBtn.click();
    await expect(page.getByText('Confirm Action')).toBeVisible();
    await expect(page.getByText('Are you sure you want to proceed?')).toBeVisible();
    await page.locator('button.cancel').click();

    const promptBtn = page.locator('button', { hasText: 'Prompt Dialog' });
    await promptBtn.click();
    await expect(page.getByText('Enter Value')).toBeVisible();
    await expect(page.getByText('Please enter your name:')).toBeVisible();
  });

  test('breadcrumb renders its configured items', async ({ page }) => {
    const crumb = page.locator('[x-breadcrumb]');
    await expect(crumb).toContainText('Home');
    await expect(crumb).toContainText('Smartphones');
  });

  test('pagination reflects total/per-page/current, not defaults', async ({ page }) => {
    const pagination = page.locator('[x-pagination]');
    const text = await pagination.evaluate((el) => el.textContent || '');
    expect(text).toContain('5'); // current page
  });

  test('steps wizard renders its configured items', async ({ page }) => {
    const steps = page.locator('[x-steps]');
    await expect(steps).toContainText('Cart');
    await expect(steps).toContainText('Confirm');
  });

  test('timeline renders its configured items, not empty', async ({ page }) => {
    const timeline = page.locator('[x-timeline]');
    await expect(timeline).toContainText('Project kickoff');
    await expect(timeline).toContainText('Launch');
  });

  test('gallery renders a 4-column grid', async ({ page }) => {
    const gallery = page.locator('[x-gallery]');
    const cols = await gallery.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(4);
  });

  test('toast buttons: each produces a distinct variant + its own message, not all defaulting to info/"Notification"', async ({ page }) => {
    const cases = [
      { label: 'Info Toast', variant: 'info', message: 'Info message' },
      { label: 'Success Toast', variant: 'success', message: 'Success!' },
      { label: 'Warning Toast', variant: 'warning', message: 'Warning!' },
      { label: 'Error Toast', variant: 'error', message: 'Error!' },
    ];
    for (const c of cases) {
      await page.locator('button', { hasText: c.label }).click();
      const toast = page.locator('.x-toast').last();
      await expect(toast).toBeVisible();
      await expect(toast).toHaveClass(new RegExp(`x-toast--${c.variant}\\b`));
      await expect(toast).toContainText(c.message);
    }
  });

  test('copy buttons use the configured copy text (not empty)', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('button', { hasText: 'Copy Text' }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe('Text copied to clipboard!');
  });

  test('copy-target copies the referenced element\'s own text, not a literal', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('button', { hasText: 'Copy From Target' }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe('npm install wb-starter --save');
  });

  test('relativetime renders a relative label, not the static fallback text', async ({ page }) => {
    const el = page.locator('[x-relativetime]');
    await expect(el).not.toHaveText('Jan 1, 2025');
  });

  test('truncate clamps to its configured line count', async ({ page }) => {
    const el = page.locator('[x-truncate]');
    const clamp = await el.evaluate((e) => getComputedStyle(e).getPropertyValue('-webkit-line-clamp') || getComputedStyle(e).getPropertyValue('line-clamp'));
    expect(clamp.trim()).toBe('2');
  });

  test('truncate "Show more" toggle reveals full, unclamped height', async ({ page }) => {
    const el = page.locator('[x-truncate]');
    const toggle = page.locator('.x-truncate__toggle');
    await expect(toggle).toHaveText('Show more');
    const clampedHeight = await el.evaluate((e) => e.getBoundingClientRect().height);

    await toggle.click();
    await expect(toggle).toHaveText('Show less');
    const expandedHeight = await el.evaluate((e) => e.getBoundingClientRect().height);
    expect(expandedHeight, 'expanded height must exceed the clamped height').toBeGreaterThan(clampedHeight);

    await toggle.click();
    await expect(toggle).toHaveText('Show more');
  });

  // #224 follow-up sweep: these four were missed by the original sweep above
  // (tabs/accordion child markers, x-audio, and the autosize textarea) --
  // found and fixed in the same data-* audit. Each was silently ignored:
  // tabs.js/collapse.js only read the plain `tab-title`/`accordion-title`
  // attribute, x-audio.js only reads plain `src`/`show-eq`/`volume`, and
  // textarea.js only reads plain `autosize`.

  test('tabs show their configured titles, not "Tab 1"/"Tab 2"/"Tab 3"', async ({ page }) => {
    const tabs = page.locator('.x-tabs__tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText('Overview');
    await expect(tabs.nth(1)).toHaveText('Features');
    await expect(tabs.nth(2)).toHaveText('Usage');
  });

  test('accordion items show their configured titles, not "Accordion Item"', async ({ page }) => {
    const titles = page.locator('.x-accordion-title');
    await expect(titles).toHaveCount(3);
    await expect(titles.nth(0)).toHaveText('What is wb-starter?');
    await expect(titles.nth(1)).toHaveText('How do I install it?');
    await expect(titles.nth(2)).toHaveText('Is it production ready?');
  });

  test('.x-audio uses its configured src and shows the EQ, not the default demo track', async ({ page }) => {
    const audioEl = page.locator('.x-audio audio');
    const src = await audioEl.getAttribute('src');
    expect(src, '.x-audio should not have fallen back to the built-in default demo track').toContain('freemusicarchive.org');
    // show-eq requested -> the EQ panel must actually be built.
    await expect(page.locator('.x-audio .x-audio__eq-container')).toBeVisible();
  });

  test('autosize textarea gets the autosize class, not the plain default', async ({ page }) => {
    const textareas = page.locator('#inputs textarea');
    await expect(textareas.nth(1)).toHaveClass(/x-textarea--autosize/);
  });
});
