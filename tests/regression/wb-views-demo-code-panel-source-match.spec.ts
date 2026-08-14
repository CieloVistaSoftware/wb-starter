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
  // The example-blocks these tests actually assert against -- waiting on
  // just these (rather than all ~20 on the page) keeps the wait fast and
  // avoids coupling to unrelated blocks further down the page.
  //
  // "Standard Buttons (wb-button)" was removed from this list along with
  // its whole section: wb-button is a real premade component, not a
  // wb-view, and John decided this wb-views-teaching page shouldn't show
  // non-wb-view examples at all ("DON'T SHOW NON WB-VIEWS ON THE WB-VIEWS
  // PAGE") -- previously it was kept as a labeled contrast example, now
  // it's gone entirely. The remaining labels also picked up a "② Reuse — "
  // prefix as part of the same pass (making explicit which step of
  // define/reuse/render each example-block represents).
  const CHECKED_LABELS = [
    '② Reuse — User Avatars (user-avatar)',
    '② Reuse — Navigation Items (nav-link)',
    '② Reuse — Pricing Components (price-tag, feature-item)',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    // Wait for the wb-views {{code}} interpolation to land in each checked
    // example-block's .example-codes panel -- NOT for mdhtml.js's own
    // separate syntax-highlighting hydration (x-hydrated="1", set after
    // marked.js parses + highlight.js tokenizes the text). This test only
    // cares whether the RIGHT TEXT is there (#580's actual bug: the wrong
    // text, or a literal "{{code}}"), and that text is already fully
    // determined the moment example-block's own renderView() substitutes
    // {{code}} -- a synchronous-ish wb-views template step that doesn't
    // depend on mdhtml.js, marked.js, or any network fetch at all.
    //
    // An earlier version of this wait DID key off x-hydrated, and that
    // turned out to be a bad idea independent of #580: mdhtml.js's
    // hydration (real CDN fetch of marked.js, plus a self-fetch via
    // getPageSource()) reliably hangs indefinitely for the 3rd+
    // <wb-mdhtml> element on THIS page in this session's environment --
    // confirmed on BOTH this branch and the pre-existing baseline before
    // any of this pass's changes (same shape: the first couple hydrate,
    // everything after never does, even after 90+ seconds of waiting) --
    // a genuine, separate, pre-existing issue, not something a longer
    // timeout fixes. Keying this wait off the plain text content instead
    // sidesteps that hang entirely while still testing exactly what #580
    // was about.
    await page.waitForFunction((labels) => {
      return labels.every((label) => {
        const block = document.querySelector(`example-block[label="${label}"]`);
        return !!block?.querySelector('.example-codes')?.textContent?.trim();
      });
    }, CHECKED_LABELS, { timeout: 30000 });
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

  test('"User Avatars (user-avatar)" shows its OWN real avatar markup as source', async ({ page }) => {
    const avatarsBlock = page.locator('example-block[label="② Reuse — User Avatars (user-avatar)"]');
    await expect(avatarsBlock, 'the Avatars example-block should exist on the page').toHaveCount(1);

    const codePanel = avatarsBlock.locator('.example-codes');
    await expect(codePanel).toContainText('user-avatar');
    await expect(codePanel).toContainText('John Doe');
  });

  test('each example-block\'s code panel matches its OWN section, not a shifted neighbor\'s', async ({ page }) => {
    // Regression guard for the off-by-one specifically: pair each block's
    // label with a substring that ONLY that block's real source contains.
    const expectations: Array<[label: string, mustContain: string]> = [
      ['② Reuse — User Avatars (user-avatar)', 'user-avatar'],
      ['② Reuse — Navigation Items (nav-link)', 'nav-link'],
      ['② Reuse — Pricing Components (price-tag, feature-item)', 'price-tag'],
    ];

    for (const [label, mustContain] of expectations) {
      const block = page.locator(`example-block[label="${label}"]`);
      await expect(block, `expected an example-block labeled "${label}"`).toHaveCount(1);
      await expect(block.locator('.example-codes'), `"${label}"'s code panel should contain its OWN source ("${mustContain}"), not a neighboring block's`).toContainText(mustContain);
    }
  });
});
