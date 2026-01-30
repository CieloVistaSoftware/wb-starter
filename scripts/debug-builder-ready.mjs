import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoles = [];
  page.on('console', m => {
    const loc = m.location ? m.location() : undefined;
    consoles.push(`${m.type()}: ${m.text()}${loc ? ` (${loc.url}:${loc.line}:${loc.column})` : ''}`);
  });
  page.on('pageerror', e => consoles.push(`pageerror: ${e && e.stack ? e.stack : String(e)}`));

  try {
    await page.goto('http://localhost:3000/builder.html', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const snapshot = await page.evaluate(() => {
      const panel = document.querySelector('#propertiesPanel');
      return {
        builderReady: window.builderReady === true ? true : (window.builderReady === false ? false : null),
        wbBehaviors: Object.keys((window.WB && window.WB.behaviors) || {}).length,
        hasCanvas: !!document.querySelector('.canvas-component'),
        propsPanelExists: !!panel,
        themeFlag: panel ? panel.dataset.themeSectionReady || null : null
      };
    });

    console.log('SNAPSHOT:', JSON.stringify(snapshot, null, 2));
    if (consoles.length) console.log('CONSOLE:\n' + consoles.join('\n'));
  } catch (err) {
    console.error('ERROR WHILE LOADING builder.html', err);
    if (consoles.length) console.log('CONSOLE (partial):\n' + consoles.join('\n'));
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();