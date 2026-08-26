/**
 * Header Behavior Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Header Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/autoinject.html');
    await page.waitForTimeout(300);
  });

  test('renders with icon and title', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header icon="📂" title="Project Index" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const header = page.locator('#testHeader');
    // #448: a literal <header> host no longer carries a same-named
    // `.x-header` class -- header.css selects the tag directly. Its own
    // icon/title children (checked below) already prove header() enhanced
    // it; this just confirms the enhancement ran on the right element.
    await expect(header).toHaveJSProperty('tagName', 'WB-HEADER');

    const icon = header.locator('.x-header__icon');
    await expect(icon).toHaveText('📂');
    
    const title = header.locator('.x-header__title');
    await expect(title).toHaveText('Project Index');
  });

  test('renders badge on right side', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header title="App" badge="v1.0" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const badge = page.locator('#testHeader .x-header__right .x-tag-glass');
    await expect(badge).toHaveText('v1.0');
  });

  test('applies sticky class when sticky present', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header title="Sticky" sticky id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const header = page.locator('#testHeader');
    await expect(header).toHaveClass(/x-header--sticky/);
  });

  test('renders subtitle', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header title="Dashboard" subtitle="Analytics" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const subtitle = page.locator('#testHeader .x-header__subtitle');
    await expect(subtitle).toHaveText('Analytics');
  });

  test('logo links when logoHref provided', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header icon="🏠" title="Home" logo-href="/home" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const logo = page.locator('#testHeader .x-header__logo');
    await expect(logo).toHaveAttribute('href', '/home');
  });

  test('API: setTitle updates title', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header title="Original" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    
    // Wait for API to be attached
    await page.waitForFunction(() => {
      const el = document.getElementById('testHeader');
      return el && el.wbHeader && typeof el.wbHeader.setTitle === 'function';
    });
    
    await page.evaluate(() => {
      document.getElementById('testHeader').wbHeader.setTitle('Updated');
    });
    
    const title = page.locator('#testHeader .x-header__title');
    await expect(title).toHaveText('Updated');
  });

  test('API: setBadge updates badge', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header title="App" badge="v1.0" id="testHeader"></header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    
    // Wait for API to be attached
    await page.waitForFunction(() => {
      const el = document.getElementById('testHeader');
      return el && el.wbHeader && typeof el.wbHeader.setBadge === 'function';
    });
    
    await page.evaluate(() => {
      document.getElementById('testHeader').wbHeader.setBadge('v2.0');
    });
    
    const badge = page.locator('#testHeader .x-header__right .x-tag-glass');
    await expect(badge).toHaveText('v2.0');
  });

  test('preserves slot content', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <header id="testHeader">
          <div slot="right"><button id="customBtn">Action</button></div>
        </header>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB) await window.WB.scan(document.body);
    });
    await page.waitForTimeout(200);
    
    const btn = page.locator('#customBtn');
    await expect(btn).toBeVisible();
  });

});
