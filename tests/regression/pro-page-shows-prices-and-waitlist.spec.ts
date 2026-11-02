import { test, expect } from '../fixtures/offline';

/**
 * #1961: the WB Pro page listed what Pro adds but showed no price and no way to
 * join the waitlist -- step B of the plan in
 * docs/architecture/proposals/WB-PRO-ACCESS.md (#1953). Checkout is built only
 * after about 20 waitlist sign-ups, so the page has to state the real launch
 * prices: a sign-up then means interest at that price.
 *
 * Until John's Lemon Squeezy sign-up form exists, the page says the form opens
 * soon and shows no form that goes nowhere.
 */
test('the WB Pro page shows the launch prices and the waitlist (#1961)', async ({ page }) => {
  await page.goto('/?page=pro');

  const personal = page.locator('#pro-article-18');
  const team = page.locator('#pro-article-22');
  await expect(personal).toContainText('$79');
  await expect(personal).toContainText('$129');
  await expect(team).toContainText('$249');
  await expect(team).toContainText('$399');
  await expect(team).toContainText('10 developers');

  const waitlist = page.locator('#pro-div-26');
  await expect(waitlist.locator('h2')).toHaveText('Join the waitlist');
  await expect(waitlist).toContainText('launch price');
  // No form until it has somewhere to send the address.
  await expect(waitlist.locator('form')).toHaveCount(0);
});
