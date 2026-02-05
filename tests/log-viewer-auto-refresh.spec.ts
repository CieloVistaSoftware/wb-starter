import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Log Viewer Auto-Refresh Toggle', () => {
  test('toggle button stops and starts auto-refresh correctly', async ({ page }) => {
    // Navigate to the log viewer
    const logViewerPath = path.resolve('mcp-server/logs/log-viewer.html');
    await page.goto(`file:///${logViewerPath.replace(/\\/g, '/')}`);
    
    // Wait for initial load
    await page.waitForTimeout(300);
    
    const autoBtn = page.locator('#auto-refresh');
    const indicator = page.locator('#auto-refresh .indicator');
    
    // Initially should be OFF
    await expect(indicator).toHaveClass(/off/);
    let state = await page.evaluate(() => ({ isAutoOn: (window as any).isAutoOn, timerId: (window as any).timerId }));
    expect(state.isAutoOn).toBe(false);
    expect(state.timerId).toBeNull();
    
    // Click to turn ON
    await autoBtn.click();
    await expect(indicator).toHaveClass(/on/);
    state = await page.evaluate(() => ({ isAutoOn: (window as any).isAutoOn, timerId: (window as any).timerId }));
    expect(state.isAutoOn).toBe(true);
    expect(state.timerId).not.toBeNull();
    
    // Click to turn OFF
    await autoBtn.click();
    await expect(indicator).toHaveClass(/off/);
    state = await page.evaluate(() => ({ isAutoOn: (window as any).isAutoOn, timerId: (window as any).timerId }));
    expect(state.isAutoOn).toBe(false);
    expect(state.timerId).toBeNull();
    
    // Verify refresh count doesn't increase while OFF
    const countAtOff = await page.evaluate(() => (window as any).refreshCount);
    await page.waitForTimeout(1000);
    const countAfterWait = await page.evaluate(() => (window as any).refreshCount);
    expect(countAfterWait).toBe(countAtOff);
    
    console.log('✓ Toggle works: ON sets timer, OFF clears timer');
  });
});
