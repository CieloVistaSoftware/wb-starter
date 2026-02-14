// Builder API tests
// Testing the programmatic API for builder functionality


// Extend the Window interface to include builderAPI
declare global {
  interface Window {
    builderAPI: any;
  }
}

import { test, expect } from '@playwright/test';

test.describe('Builder API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    // Wait for builderAPI to be defined (set after start() runs)
    await page.waitForFunction(() => typeof window.builderAPI !== 'undefined', { timeout: 5000 });
    await page.evaluate(() => window.builderAPI.reset());
  });

  test('add() creates a dropped wrapper', async ({ page }) => {
    const id = 'api-test-1';
    await page.evaluate(() => {
      window.builderAPI.add({ b: 'builder', n: 'API Test', d: { label: 'API', icon: '🧩', id: 'api-test-1' } });
    });
    await page.waitForSelector('.dropped', { state: 'attached', timeout: 3000 });
    const wrapper = await page.$('.dropped');
    expect(wrapper).not.toBeNull();
    const builder = await page.$('wb-builder');
    expect(builder).not.toBeNull();
    if (builder) {
      expect(await builder.getAttribute('data-label')).toBe('API');
    }
  });

  test('remove() deletes a dropped wrapper', async ({ page }) => {
    await page.evaluate(() => {
      window.builderAPI.add({ b: 'builder', n: 'API Test', d: { label: 'API', icon: '🧩', id: 'api-test-2' } });
    });
    await page.waitForSelector('.dropped', { state: 'attached', timeout: 3000 });
    const id = await page.evaluate(() => {
      const el = document.querySelector('.dropped');
      return el ? el.id : null;
    });
    const removed = await page.evaluate((id) => window.builderAPI.remove(id), id);
    expect(removed).toBe(true);
    const wrapper = await page.$('.dropped');
    expect(wrapper).toBeNull();
  });

  test('update() changes builder attributes', async ({ page }) => {
    await page.evaluate(() => {
      window.builderAPI.add({ b: 'card', n: 'API Test', d: { label: 'API', title: 'Test Card' } });
    });
    await page.waitForSelector('.dropped', { state: 'attached', timeout: 3000 });
    const id = await page.evaluate(() => {
      const el = document.querySelector('.dropped');
      return el ? el.id : null;
    });
    // update() sets attributes on the wrapper, not the inner element
    await page.evaluate((id) => window.builderAPI.update(id, { 'data-label': 'Updated' }), id);
    const wrapper = await page.$('.dropped');
    expect(wrapper).not.toBeNull();
    if (wrapper) {
      expect(await wrapper.getAttribute('data-label')).toBe('Updated');
    }
  });

  test('reset() clears all components', async ({ page }) => {
    await page.evaluate(() => {
      window.builderAPI.add({ b: 'builder', n: 'API Test', d: { label: 'API', icon: '🧩', id: 'api-test-4' } });
    });
    await page.waitForSelector('.dropped', { state: 'attached', timeout: 3000 });
    await page.evaluate(() => window.builderAPI.reset());
    const wrapper = await page.$('.dropped');
    expect(wrapper).toBeNull();
  });

  test('get() returns the wrapper element', async ({ page }) => {
    await page.evaluate(() => {
      window.builderAPI.add({ b: 'builder', n: 'API Test', d: { label: 'API', icon: '🧩', id: 'api-test-5' } });
    });
    await page.waitForSelector('.dropped', { state: 'attached', timeout: 3000 });
    const id = await page.evaluate(() => {
      const el = document.querySelector('.dropped');
      return el ? el.id : null;
    });
    const exists = await page.evaluate((id) => !!window.builderAPI.get(id), id);
    expect(exists).toBe(true);
  });
});
