const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', m => console.log('PAGE LOG>', m.text()));
  try {
    await page.goto('http://localhost:3000/builder.html', { waitUntil: 'load', timeout: 15000 });
    const before = await page.$('wb-issues');
    console.log('exists before click?', !!before);
    await page.click('#headerIssuesBtn');
    await page.waitForSelector('wb-issues', { timeout: 5000 });
    const after = await page.$('wb-issues');
    console.log('exists after click?', !!after);
  } catch (e) {
    console.error('TEST ERROR', e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();