import { test, expect } from '@playwright/test';

/**
 * #580: John, live screenshot -- demos/wb-views-demo.html's "Buttons"
 * section (heading "Buttons", tag "variants + icons", subsection
 * "STANDARD BUTTONS (WB-BUTTON)") showed a literal, unrendered `{{code}}`
 * string where the code sample should be.
 *
 * Root cause: src/wb-viewmodels/page-source-cache.js's getPageSource() /
 * extractTagBlock() match a live <wb-mdhtml> element to "its" source block
 * by ORDINAL POSITION -- "I'm the Nth <wb-mdhtml> in the live DOM, so give
 * me the Nth <wb-mdhtml>...</wb-mdhtml> occurrence in the page's raw HTML
 * text." That only holds if the raw-text count and the live-DOM count agree.
 * They didn't here: demos/wb-views-demo.html's
 * `<template wb-view="example-block">` embeds a literal
 * `<wb-mdhtml>{{code}}</wb-mdhtml>` as its own placeholder markup. A
 * <template>'s content is inert (never parsed into the live document), so
 * `document.querySelectorAll('wb-mdhtml')` correctly never counts it -- but
 * the old regex-based extractTagBlock scan had no concept of <template>
 * boundaries and counted it as occurrence #0 anyway. Every real element's
 * index was off by one as a result: "Standard Buttons (wb-button)" (the
 * page's first real <wb-mdhtml>) matched the template's own placeholder
 * text and rendered literal, un-interpolated "{{code}}"; every element
 * after it rendered the PREVIOUS element's code sample instead of its own
 * (confirmed live: "Avatars" showed the "How It Works" example's
 * badge-tag markup).
 *
 * Fix: getPageSource() strips <template>...</template> blocks before the
 * ordinal scan, restoring parity with what the live DOM already excludes.
 */

test.describe('demos/wb-views-demo.html: example-block code panels show real, correctly-matched content (#580)', () => {
  // Hydration here involves a real network round-trip (getPageSource()
  // fetching the page's own HTML, mdhtml.js's marked.js CDN load) -- give it
  // more headroom than the 30s default under load.
  test.describe.configure({ timeout: 60000 });

  // The four example-blocks these tests actually assert against -- waiting
  // on just these (rather than all ~22 on the page) keeps the wait fast and
  // avoids coupling to unrelated blocks further down the page.
  const CHECKED_LABELS = [
    'Standard Buttons (wb-button)',
    'User Avatars (user-avatar)',
    'Navigation Items (nav-link)',
    'Pricing Components (price-tag, feature-item)',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    // Wait for each checked example-block's <wb-mdhtml> code panel to finish
    // hydrating (mdhtml.js marks x-hydrated="1" once markdown parsing
    // completes -- see src/wb-viewmodels/mdhtml.js).
    await page.waitForFunction((labels) => {
      return labels.every((label) => {
        const block = document.querySelector(`example-block[label="${label}"]`);
        const panel = block?.querySelector('.example-codes wb-mdhtml');
        return !!panel?.hasAttribute('x-hydrated');
      });
    }, CHECKED_LABELS, { timeout: 60000 });
  });

  test('no code panel ever shows the literal, un-interpolated "{{code}}" placeholder', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('{{code}}');

    // Belt-and-suspenders: no example-block's rendered code panel should
    // contain ANY unresolved {{...}} mustache token.
    const mustacheLeaks = await page.evaluate(() => {
      const leaks: string[] = [];
      document.querySelectorAll('example-block').forEach((block) => {
        const panel = block.querySelector('.example-codes');
        if (panel && /\{\{[^}]*\}\}/.test(panel.textContent || '')) {
          leaks.push(block.getAttribute('label') || '(no label)');
        }
      });
      return leaks;
    });
    expect(mustacheLeaks, `example-block(s) with an unresolved {{...}} token in their code panel: ${mustacheLeaks.join(', ')}`).toEqual([]);
  });

  test('"Standard Buttons (wb-button)" shows its OWN real button markup as source', async ({ page }) => {
    const buttonsBlock = page.locator('example-block[label="Standard Buttons (wb-button)"]');
    await expect(buttonsBlock, 'the Buttons example-block should exist on the page').toHaveCount(1);

    const codePanel = buttonsBlock.locator('.example-codes');
    await expect(codePanel).toContainText('wb-button');
    await expect(codePanel).toContainText('Primary');
    await expect(codePanel).toContainText('Delete');
  });

  test('each example-block\'s code panel matches its OWN section, not a shifted neighbor\'s', async ({ page }) => {
    // Regression guard for the off-by-one specifically: pair each block's
    // label with a substring that ONLY that block's real source contains.
    const expectations: Array<[label: string, mustContain: string]> = [
      ['Standard Buttons (wb-button)', 'wb-button'],
      ['User Avatars (user-avatar)', 'user-avatar'],
      ['Navigation Items (nav-link)', 'nav-link'],
      ['Pricing Components (price-tag, feature-item)', 'price-tag'],
    ];

    for (const [label, mustContain] of expectations) {
      const block = page.locator(`example-block[label="${label}"]`);
      await expect(block, `expected an example-block labeled "${label}"`).toHaveCount(1);
      await expect(block.locator('.example-codes'), `"${label}"'s code panel should contain its OWN source ("${mustContain}"), not a neighboring block's`).toContainText(mustContain);
    }
  });
});
