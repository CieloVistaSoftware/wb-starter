import playwright from 'playwright';
(async() => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  try {
    await page.goto('http://localhost:3000/builder.html', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    const h1s = await page.$$eval('h1', els => els.map(e => e.outerHTML));
    console.log('H1 elements found:', h1s.length);
    h1s.forEach((h, i) => console.log(`H1[${i}]: ${h}`));
    const visible = await page.$eval('h1', el => {
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0 && el.offsetWidth > 0;
    }).catch(() => false);
    console.log('First h1 visible?', visible);
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await browser.close();
  }
})();