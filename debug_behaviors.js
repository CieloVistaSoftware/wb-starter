const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));
  
  try {
    console.log('Navigating to behaviors.html...');
    await page.goto('http://localhost:3000/demos/behaviors.html');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('Error:', e);
  }
  
  await browser.close();
})();
