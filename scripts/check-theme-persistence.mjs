import playwright from 'playwright';
(async() => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  try {
    await page.goto('http://localhost:3000/builder.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // select first component
    await page.click('.canvas-component');
    await page.waitForTimeout(200);
    const compId = await page.evaluate(() => window.selectedComponent?.id);
    console.log('Selected component id:', compId);

    // find select element
    const panelHtml = await page.$eval('#propertiesPanel', el => el.innerHTML).catch(() => 'properties panel missing');
    console.log('propertiesPanel HTML (truncated):', panelHtml.substring(0, 2000));

    const themeSelect = await page.$('.prop-category:has-text("Element Theme") select');
    if (!themeSelect) { console.log('No theme select found'); return; }

    // set to sunset
    await themeSelect.selectOption('sunset');
    await page.waitForTimeout(200);
    console.log('Selected option after set:', await themeSelect.evaluate(el => el.value));

    // check component data
    let compData = await page.evaluate((id) => {
      const comp = (window.BuilderState && window.BuilderState.findComponent) ? window.BuilderState.findComponent(id) : window.components?.find(c => c.id === id);
      return comp?.data?.elementTheme;
    }, compId);
    console.log('Component data elementTheme after set:', compData);

    // click canvas to deselect
    await page.click('.canvas-area', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    // reselect same component
    await page.click(`.canvas-component[data-id="${compId}"]`).catch(()=>{});
    // fallback: click first again
    await page.click('.canvas-component').catch(()=>{});
    await page.waitForTimeout(300);

    const selectedValue = await page.$eval('.prop-category:has-text("Element Theme") select', el => el.value);
    console.log('Selected value after reselect:', selectedValue);

    compData = await page.evaluate((id) => {
      const comp = (window.BuilderState && window.BuilderState.findComponent) ? window.BuilderState.findComponent(id) : window.components?.find(c => c.id === id);
      return comp?.data?.elementTheme;
    }, compId);
    console.log('Component data elementTheme after reselect:', compData);

  } catch (err) {
    console.error('Error during theme persistence check:', err);
  } finally {
    await browser.close();
  }
})();