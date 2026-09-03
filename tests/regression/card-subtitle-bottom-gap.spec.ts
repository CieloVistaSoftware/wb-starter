import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * Every card variant's subtitle must keep a 0.5rem gap below it (John's
 * direct instruction).
 *
 * REWRITTEN (#924). The previous version could never pass, for two reasons,
 * and had been failing 6/6 on both arms of an A/B against HEAD:
 *
 *  1. It interpolated CSS SELECTORS as TAG NAMES --
 *     `<${tag} title="Title">` with tag = '.x-card' or '[x-cardhorizontal]'
 *     emitted `<.x-card title="Title">` and `<[x-cardhorizontal] ...>`.
 *     Confirmed in the browser: that markup parses to a text node and a
 *     comment, `children.length === 0`. No card was ever built, so the
 *     assertion below it never ran against anything.
 *
 *  2. It selected `.x-card__subtitle`, a class the generic header stopped
 *     injecting at a8a7362e ("specificity replaces class injection").
 *     card.css now styles the subtitle structurally --
 *     `article > header > p` -- so the class is present only on the two
 *     renderers that still set it (hero, profile role badge).
 *
 * Both defects are the same mistake: encoding a STRUCTURE the architecture
 * had moved on from. So this version asserts the REQUIREMENT instead --
 * whatever element renders the subtitle text keeps an 8px bottom margin --
 * and stays agnostic about tag, class and depth, per Law 0 (the host tag is
 * the author's choice).
 */
const VARIANTS = [
  'x-card',
  'x-cardhorizontal',
  'x-cardoverlay',
  'x-cardminimizable',
  'x-cardproduct',
  // NOT x-cardprofile. It does not declare `subtitle` -- cardprofile.schema.json
  // publishes name / role / bio / avatar / cover / align / size, and card.js
  // reads `role`, rendering it as an absolutely-positioned badge that reuses the
  // .x-card__subtitle class. There is no subtitle to keep a gap under.
  //
  // Worth recording WHY it was in this list: before #923, <article x-cardprofile>
  // ran the article behavior AND cardprofile, and the article half rendered a
  // subtitle from an attribute cardprofile never supported. The case only ever
  // "passed" because of the double-render. Fixing that exposed it.
];

test.describe('card subtitles keep a 0.5rem bottom gap', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  for (const behavior of VARIANTS) {
    test(`[${behavior}]: subtitle has 8px (0.5rem) margin-bottom`, async ({ page }) => {
      // A semantic host carrying the behavior attribute -- Law 0. <article> is
      // the element that already means "a self-contained composition".
      const el = await setupTestContainer(
        page,
        `<article ${behavior} title="Title" subtitle="Subtitle text"></article>`
      );

      // Find whatever element actually renders the subtitle, by its text.
      const subtitle = el.locator(':text-is("Subtitle text")').last();
      await expect(subtitle).toHaveCount(1);
      await expect(subtitle).toHaveCSS('margin-bottom', '8px');
    });
  }
});
