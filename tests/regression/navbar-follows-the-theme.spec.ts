import { test, expect } from '../fixtures/offline';

/**
 * x-navbar FOLLOWS THE THEME (#1946)
 * ==================================
 * navbar.css painted the bar rgba(15, 23, 42, 0.7) and its links white on
 * every theme, so on Light the page turned light and the navbar stayed dark.
 * Its colours now come from the theme's variables.
 */
test.use({ serviceWorkers: 'block' });

const PAGE = '/tests/fixtures/navbar-theme.html';
const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="/src/styles/themes.css">
<link rel="stylesheet" href="/src/styles/site.css">
<script type="module">
  import WB from '/src/core/wb.js';
  WB.init();
</script></head>
<body><nav x-navbar brand="Brand" items="Home:#home,About:#about"></nav></body></html>`;

test('the navbar background and link colour change with the theme', async ({ page }) => {
  await page.route(`**${PAGE}`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: HTML }));
  await page.goto(PAGE);
  const nav = page.locator('[x-navbar]');
  await expect(nav.locator('a').nth(1)).toBeVisible();

  // The bar and its links fade between colours (transition: 0.3s), so read
  // them with transitions switched off: the values the theme sets, not a
  // frame from the middle of the fade.
  await page.addStyleTag({ content: '[x-navbar], [x-navbar] * { transition: none !important; }' });
  const look = () => nav.evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    link: getComputedStyle(el.querySelectorAll('a')[2]).color,
  }));
  // navbar.css arrives after the behavior applies; measure once it has.
  await expect.poll(async () => (await look()).bg, { message: 'navbar.css never painted the bar' }).not.toMatch(/\/ 0\)$|rgba\(0, 0, 0, 0\)/);
  const dark = await look();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const light = await look();

  expect(dark.bg, 'the old fixed slate must be gone').not.toBe('rgba(15, 23, 42, 0.7)');
  expect(light.bg, 'Light must give the navbar a different background from Dark').not.toBe(dark.bg);
  expect(light.link, 'Light must give the links a different colour from Dark').not.toBe(dark.link);
});
