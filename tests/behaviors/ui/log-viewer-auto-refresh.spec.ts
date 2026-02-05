// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Log Viewer Auto-Refresh Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Use the local http-server on port 9999
    await page.goto('http://localhost:9999/test-auto-refresh.html');
    // Wait for page to load
    await page.waitForSelector('#auto-refresh');
  });

  test('initial state: indicator is OFF and no interval', async ({ page }) => {
    const indicator = page.locator('#auto-refresh .indicator');
    await expect(indicator).toHaveClass(/off/);
    await expect(indicator).not.toHaveClass(/on/);
    
    // Check window._autoRefreshId is null
    const intervalId = await page.evaluate(() => window._autoRefreshId);
    expect(intervalId).toBeNull();
  });

  test('clicking toggle turns ON', async ({ page }) => {
    await page.click('#auto-refresh');
    
    const indicator = page.locator('#auto-refresh .indicator');
    await expect(indicator).toHaveClass(/on/);
    await expect(indicator).not.toHaveClass(/off/);
    
    const intervalId = await page.evaluate(() => window._autoRefreshId);
    expect(intervalId).not.toBeNull();
  });

  test('clicking toggle twice turns OFF', async ({ page }) => {
    await page.click('#auto-refresh'); // ON
    await page.click('#auto-refresh'); // OFF
    
    const indicator = page.locator('#auto-refresh .indicator');
    await expect(indicator).toHaveClass(/off/);
    await expect(indicator).not.toHaveClass(/on/);
    
    const intervalId = await page.evaluate(() => window._autoRefreshId);
    expect(intervalId).toBeNull();
  });

  test('when OFF, no refresh happens', async ({ page }) => {
    // Ensure OFF
    const intervalId = await page.evaluate(() => window._autoRefreshId);
    expect(intervalId).toBeNull();
    
    const countBefore = await page.evaluate(() => window._refreshCount);
    
    // Wait 1.5 seconds
    await page.waitForTimeout(1500);
    
    const countAfter = await page.evaluate(() => window._refreshCount);
    expect(countAfter).toBe(countBefore);
  });

  test('when ON, refresh happens', async ({ page }) => {
    await page.click('#auto-refresh'); // Turn ON
    
    const countBefore = await page.evaluate(() => window._refreshCount);
    
    // Wait for 2+ ticks (interval is 1s in test)
    await page.waitForTimeout(2500);
    
    const countAfter = await page.evaluate(() => window._refreshCount);
    expect(countAfter).toBeGreaterThan(countBefore);
    
    // Clean up
    await page.click('#auto-refresh'); // Turn OFF
  });

  test('after turning OFF, no more refresh', async ({ page }) => {
    await page.click('#auto-refresh'); // ON
    await page.waitForTimeout(1100); // Wait for at least 1 tick
    await page.click('#auto-refresh'); // OFF
    
    const countBefore = await page.evaluate(() => window._refreshCount);
    
    // Wait 1.5 seconds - should not tick
    await page.waitForTimeout(1500);
    
    const countAfter = await page.evaluate(() => window._refreshCount);
    expect(countAfter).toBe(countBefore);
  });

  test('rapid toggling does not create orphaned intervals', async ({ page }) => {
    // Rapidly toggle 10 times (should end up OFF since even)
    for (let i = 0; i < 10; i++) {
      await page.click('#auto-refresh');
    }
    
    const indicator = page.locator('#auto-refresh .indicator');
    await expect(indicator).toHaveClass(/off/);
    
    const intervalId = await page.evaluate(() => window._autoRefreshId);
    expect(intervalId).toBeNull();
    
    const countBefore = await page.evaluate(() => window._refreshCount);
    
    // Wait - no orphaned intervals should be ticking
    await page.waitForTimeout(1500);
    
    const countAfter = await page.evaluate(() => window._refreshCount);
    expect(countAfter).toBe(countBefore);
  });
});
