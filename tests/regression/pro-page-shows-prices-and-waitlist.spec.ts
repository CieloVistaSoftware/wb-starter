import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';

/**
 * #1961: the WB Pro page listed what Pro adds but showed no price and no way to
 * join the waitlist -- step B of the plan in
 * docs/architecture/proposals/WB-PRO-ACCESS.md (#1953). Checkout is built only
 * after about 20 waitlist sign-ups, so the page has to state the real launch
 * prices: a sign-up then means interest at that price.
 *
 * The form posts to our own waitlist Worker (server/waitlist, tested in
 * waitlist-worker.spec.ts), with a hidden "website" field that only bots fill.
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
  const form = waitlist.locator('form');
  // The page as authored posts to the deployed Worker; on localhost (as here)
  // its script points the form at the local Worker from npm run pro:local.
  const authored = fs.readFileSync('pages/pro.html', 'utf8');
  expect(authored).toContain('action="https://waitlist.cielovistasoftware.com/join"');
  await expect(form).toHaveAttribute('action', 'http://localhost:8787/join');
  await expect(form).toHaveAttribute('method', 'post');
  await expect(form.getByLabel('Email')).toHaveAttribute('type', 'email');
  await expect(form.getByRole('button', { name: 'Join the waitlist' })).toBeVisible();
  // The bot trap is in the form but not on screen.
  const trap = form.locator('input[name="website"]');
  await expect(trap).toHaveCount(1);
  const box = await trap.boundingBox();
  expect(box === null || box.x + box.width <= 0, 'the trap field is off-screen').toBe(true);
});
