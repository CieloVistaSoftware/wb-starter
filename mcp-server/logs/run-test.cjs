const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser test...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:9999');
  await page.waitForTimeout(500);
  console.log('Page loaded');
  
  // Click run test button
  await page.click('text=Run Automated Test');
  console.log('Clicked test button, waiting 6 seconds...');
  
  // Wait for test to complete (5+ seconds)
  await page.waitForTimeout(6000);
  
  // Check result
  const resultClass = await page.$eval('#test-result', el => el.className);
  const resultMsg = await page.$eval('#test-msg', el => el.textContent);
  
  console.log('Result class:', resultClass);
  console.log('Result message:', resultMsg);
  
  if (resultClass.includes('pass')) {
    console.log('\n✓ TEST PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ TEST FAILED');
    process.exit(1);
  }
  
  await browser.close();
})();
