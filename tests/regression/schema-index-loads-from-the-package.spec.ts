import { test, expect } from '../fixtures/offline';

/**
 * THE SCHEMA INDEX LOADS FROM WHERE wb.js IS, NOT FROM WHERE THE PAGE IS (#1944)
 * ==============================================================================
 * A site that loads wb.js from the npm package
 * (jsDelivr, .../npm/<package>@1.0.1/src/core/wb.js) asked its OWN
 * site for data/schema-index.json, because schema-index.js built the URL from
 * the page's location. That was a 404, and x-cardhero rendered as an empty bar.
 *
 * Stand-in for "another site": a page at /other-site/index.html, a folder
 * this repo knows nothing about, importing wb.js by its absolute path. The
 * old code asked for /other-site/data/schema-index.json.
 */
test.use({ serviceWorkers: 'block' });

const PAGE = '/other-site/index.html';
const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="/src/styles/themes.css">
<link rel="stylesheet" href="/src/styles/site.css">
<script type="module">
  import WB from '/src/core/wb.js';
  WB.init();
</script></head>
<body><section x-cardhero title="Hello from another site" subtitle="sub" cta="Go" ctaHref="#"></section></body></html>`;

test('a page outside this site fetches the schema index from beside wb.js', async ({ page }) => {
  await page.route(`**${PAGE}`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: HTML }));
  const asked: string[] = [];
  page.on('request', (r) => { if (r.url().includes('schema-index.json')) asked.push(new URL(r.url()).pathname); });

  await page.goto(PAGE);
  await expect(page.locator('[x-cardhero]')).toContainText('Hello from another site');

  expect(asked, 'the index must be asked for at /data/, beside the module, and nowhere else').toEqual(['/data/schema-index.json']);
});
