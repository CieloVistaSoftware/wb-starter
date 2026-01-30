import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const BUILDER_URL = 'http://localhost:3000/builder.html';
  console.log('Navigating to', BUILDER_URL);
  await page.goto(BUILDER_URL, { waitUntil: 'networkidle' });
  // Clear localStorage to mimic test
  await page.evaluate(() => localStorage.clear());
  // Wait a moment for builder init to run (could be lazy) - give it a bit more time
  await page.waitForTimeout(7000);

  const el = await page.$('wb-issues#siteIssuesDrawer');
  console.log('el element handle present?', !!el);
  if (el) {
    const outerHtml = await page.evaluate(e => e.outerHTML, el);
    console.log('outerHTML (truncated):\n', outerHtml.slice(0, 2000));

    const rect = await el.boundingBox();
    console.log('boundingBox:', rect);

    const display = await page.evaluate(e => window.getComputedStyle(e).display, el);
    console.log('display style:', display);

    const dataset = await page.evaluate(e => e.dataset, el);
    console.log('dataset:', dataset);
  } else {
    console.log('No wb-issues element found');
  }

  // Check for console errors
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  // wait a bit to capture errors
  await page.waitForTimeout(1000);
  console.log('Console logs sample:', logs.slice(0,10));

  await browser.close();
})();