import playwright from 'playwright';
(async() => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err && err.message));
  try {
    await page.goto('http://localhost:3000/builder.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // select first component and click
    await page.click('.canvas-component');
    await page.waitForTimeout(200);

    // find theme select via header h4
    const themeSelectHandle = await page.$('h4:has-text("Element Theme")');
    if (!themeSelectHandle) {
      console.log('Theme header not found in panel');
    } else {
      const select = await themeSelectHandle.evaluateHandle(h => h.parentElement.querySelector('select'));
      if (!select) {
        console.log('Theme select not found via header');
      } else {
        // Check selectedComponent before change
        const selectedBefore = await page.evaluate(() => ({ id: window.selectedComponent?.id }));
        console.log('selectedComponent before select:', JSON.stringify(selectedBefore));

        // Select sunset using Playwright's selectOption (simulates user)
        const sel = await page.$('h4:has-text("Element Theme")');
        const selectElement = await sel.evaluateHandle(h => h.parentElement.querySelector('select'));
        const selectHandle = selectElement.asElement();
        if (!selectHandle) { console.log('select handle missing'); } else {
          const outer = await selectHandle.evaluate(el => el.outerHTML);
          console.log('Select outerHTML:', outer.substring(0, 400));
          await selectHandle.selectOption('sunset');
          console.log('Invoked selectOption("sunset")');
          // Also try to invoke inline onchange directly (fallback)
          await selectHandle.evaluate(el => {
            if (el.onchange) el.onchange({ target: el });
            // Some widgets attach onchange via attribute string; try calling via eval
            const attr = el.getAttribute('onchange');
            if (attr && typeof window !== 'undefined') {
              try { new Function(attr).call(el); } catch (e) { /* ignore */ }
            }
          });
        }
        await page.waitForTimeout(300);

        // Check selectedComponent after change
        const selectedAfter = await page.evaluate(() => ({ id: window.selectedComponent?.id }));
        console.log('selectedComponent after select:', JSON.stringify(selectedAfter));

        // Check component data now
        const compId = await page.evaluate(() => window.selectedComponent?.id);
        const compData = await page.evaluate((id) => {
          const comp = (window.BuilderState && window.BuilderState.findComponent) ? window.BuilderState.findComponent(id) : window.components?.find(c => c.id === id);
          return comp?.data?.elementTheme;
        }, compId);
        console.log('component data after set via selectOption:', compData);

        // Deselect by clicking canvas
        await page.click('.canvas-area', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(200);

        // Reselect
        await page.click('.canvas-component');
        await page.waitForTimeout(300);

        const selectedValue = await page.$eval('h4:has-text("Element Theme")', h => h.parentElement.querySelector('select')?.value).catch(() => null);
        console.log('Selected value after reselect:', selectedValue);

        const compDataAfter = await page.evaluate((id) => {
          const comp = (window.BuilderState && window.BuilderState.findComponent) ? window.BuilderState.findComponent(id) : window.components?.find(c => c.id === id);
          return comp?.data?.elementTheme;
        }, compId);
        console.log('component data after reselect:', compDataAfter);
      }
    }
  } catch (err) {
    console.error('Error reproducing theme failure:', err);
  } finally {
    await browser.close();
  }
})();