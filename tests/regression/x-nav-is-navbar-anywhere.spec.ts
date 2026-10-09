/**
 * <div x-nav> gets the behavior <nav> gets (#830).
 *
 * John: "Something as fundamental as a navigator should have our own
 * enhancements. It should add to the nav html element and have an equivalent
 * x-nav for injecting anywhere." <nav> has mapped to navbar since #958, but
 * x-nav was not registered, so <div x-nav> was an unknown attribute and the
 * host stayed a plain div.
 */
import { test, expect } from '../fixtures/offline';

test('<div x-nav> builds the same navbar <nav> does', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    undefined,
    { timeout: 10000 }
  );
  await page.evaluate(async () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = '<nav id="native"><a href="#a">A</a><a href="#b">B</a></nav>'
      + '<div x-nav id="anywhere"><a href="#a">A</a><a href="#b">B</a></div>';
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  });
  const classes = (id: string) => page.locator(`#${id}`).evaluate((el) => [...el.classList].sort().join(' '));
  await expect.poll(() => classes('native'), { timeout: 5000 }).toContain('x-navbar');
  await expect.poll(() => classes('anywhere'), { message: '<div x-nav> was not built as a navbar', timeout: 5000 }).toContain('x-navbar');
  // Same behavior, so the same classes on the host.
  expect(await classes('anywhere')).toBe(await classes('native'));
});
