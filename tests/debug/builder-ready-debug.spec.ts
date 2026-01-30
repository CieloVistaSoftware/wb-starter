import { test } from '@playwright/test';

test('debug: builder readiness snapshot', async ({ page }) => {
  const consoles: string[] = [];
  const errors: string[] = [];

  page.on('console', m => consoles.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('builder.html');
  // give the app some time to initialize
  await page.waitForTimeout(2000);

  const snapshot = await page.evaluate(() => {
    return {
      builderReady: (window as any).builderReady ?? null,
      wbBehaviors: Object.keys((window as any).WB?.behaviors || {}).length,
      hasCanvasComponent: !!document.querySelector('.canvas-component'),
      builderInitErrors: (window as any).builderInitError || null
    };
  });

  console.log('SNAPSHOT:', JSON.stringify(snapshot, null, 2));
  if (consoles.length) console.log('CONSOLE LOGS:\n' + consoles.join('\n'));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));

  // fail fast so CI shows output in test report
  test.fail(true, 'debug snapshot - see logs');
});