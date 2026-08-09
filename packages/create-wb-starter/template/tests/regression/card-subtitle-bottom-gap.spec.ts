import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * Every card variant's subtitle must keep a 0.5rem gap below it (John's
 * direct instruction). Several variants set their own inline
 * style.cssText that overrode card.css's correct `.wb-card__subtitle`
 * rule with margin-bottom: 0 (cardhorizontal, cardminimizable,
 * cardproduct, cardprofile's role element) or had it backwards entirely
 * (cardoverlay: 0.5rem top, 0 bottom). Fixed inline; this locks it in so
 * a future inline override can't silently drop the gap again.
 */
const VARIANTS = [
  { tag: 'wb-card', extra: '' },
  { tag: 'wb-cardhorizontal', extra: '' },
  { tag: 'wb-cardoverlay', extra: '' },
  { tag: 'wb-cardminimizable', extra: '' },
  { tag: 'wb-cardproduct', extra: '' },
  { tag: 'wb-cardprofile', extra: 'role="Engineer"' },
];

test.describe('card subtitles keep a 0.5rem bottom gap', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  for (const { tag, extra } of VARIANTS) {
    test(`${tag}: subtitle has 8px (0.5rem) margin-bottom`, async ({ page }) => {
      const el = await setupTestContainer(
        page,
        `<${tag} title="Title" subtitle="Subtitle text" ${extra}></${tag}>`
      );
      const subtitle = el.locator('.wb-card__subtitle').first();
      await expect(subtitle).toHaveCount(1);
      await expect(subtitle).toHaveCSS('margin-bottom', '8px');
    });
  }
});
