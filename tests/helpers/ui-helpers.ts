import { Page, expect } from '@playwright/test';

export async function openIssues(page: Page) {
  // Try to find issues trigger on current page, with fallbacks
  const selectors = [
    'wb-issues .wb-issues__trigger',
    'wb-issues button',
    'button[title="Open Issues"]',
    '[data-issues]',
    '.issues-button',
    'wb-issues'
  ];

  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    if (count > 0) {
      await page.locator(sel).first().click();
      return;
    }
  }

  // Try common pages
  const FALLBACKS = ['/?page=behaviors', '/builder.html', '/'];
  for (const p of FALLBACKS) {
    await page.goto('http://localhost:3000' + p);
    await page.waitForLoadState('networkidle');
    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        await page.locator(sel).first().click();
        return true;
      }
    }
  }

  return false; // Not found on page or fallbacks
}

export async function assertIssuesOpen(page: Page) {
  // Assert the issues panel/drawer is visible and not replaced by a generic "clicked" toast
  const issuesPanel = page.locator('.wb-issues__drawer, .issues-panel, wb-issues[open], wb-issues');
  await expect(issuesPanel.first()).toBeVisible({ timeout: 3000 });

  const toast = page.locator('.toast:has-text("clicked"), .toast:has-text("Clicked"), [data-toast]:has-text("click")');
  const toastVisible = await toast.isVisible().catch(() => false);
  expect(toastVisible).toBe(false);
}

export async function clickFirstNavAndAssert(page: Page) {
  await page.goto('http://localhost:3000/?page=behaviors');
  await page.waitForLoadState('networkidle');

  let navLink = page.locator('nav a[href^="#"]').first();
  const has = await navLink.count();
  if (has === 0) {
    const FALLBACKS = ['/?page=behaviors', '/builder.html', '/'];
    let _found = false;
    for (const p of FALLBACKS) {
      await page.goto('http://localhost:3000' + p);
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('nav a[href^="#"]', { timeout: 1000 }).catch(() => null);
      if (await page.locator('nav a[href^="#"]').count() > 0) {
        _found = true;
        break;
      }
    }
    if (!_found) throw new Error('no nav anchors found on known pages');
    navLink = page.locator('nav a[href^="#"]').first();
  }

  const href = await navLink.getAttribute('href');
  const target = href && href.startsWith('#') ? href.slice(1) : null;
  await navLink.click();
  await page.waitForTimeout(300);

  if (target) {
    const rectTop = await page.evaluate((sel) => {
      const el = document.getElementById(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.top;
    }, target);

    expect(rectTop).not.toBeNull();
    // Allow generous tolerance to account for sticky headers
    expect(Math.abs(rectTop)).toBeLessThan(700);
  } else {
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  }
}
