import { test, expect } from '@playwright/test';

test('inspect /builder.html for missing preview hooks', async ({ page }) => {
  const responses: string[] = [];
  const consoles: string[] = [];
  page.on('response', r => responses.push(`${r.status()} ${r.url()}`));
  page.on('console', m => consoles.push(`${m.type()}: ${m.text()}`));

  const resp = await page.goto('/builder.html');
  const body = resp ? await resp.text() : '';
  console.log('served-html-length:', body.length);
  console.log('served-html-sample:', body.slice(0,1200));

  const html = await page.content();
  const hasInline = html.includes('function doPreview(') || html.includes('window.doPreview');
  const scripts = await page.$$eval('script', ss => ss.map(s => ({ src: s.getAttribute('src'), text: s.innerText?.slice(0,200) })));
  console.log('dom-script-count:', scripts.length);
  console.log('responses (sample):', responses.slice(-10));

  // Robust wait: accept either the binder marker or the exported API (reduces timing flakes)
  try {
    await page.waitForFunction(() => !!(window.__wb_builder_dom || typeof (window as any).doPreview === 'function'), null, { timeout: 5000 });
  } catch (err) {
    // Diagnostics to help triage flakes in CI
    const recentConsole = consoles.slice(-50);
    const recentResponses = responses.slice(-20);
    const snapshot = await page.content();
    console.error('DIAGNOSTIC: builder hooks did not register within 5s');
    console.error('DIAGNOSTIC: recent console messages ->', recentConsole);
    console.error('DIAGNOSTIC: recent responses ->', recentResponses);
    console.error('DIAGNOSTIC: served-html-length ->', snapshot.length);
    throw new Error('builder hooks not registered within 5s — see diagnostics above');
  }

  const isDefined = await page.evaluate(() => typeof (window as any).doPreview === 'function');
  console.log('window.doPreview typeof ->', await page.evaluate(() => typeof (window as any).doPreview));
  expect(hasInline || isDefined).toBe(true);
});