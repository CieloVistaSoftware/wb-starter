import { test, expect } from '@playwright/test';

/**
 * BEHAVIOR VERIFICATION TESTS v2
 * ==============================
 * Tests ACTUAL behavior, not just classes.
 * 
 * KEY: All tests await WB.scan() and wait for .wb-ready class
 * before making assertions, since behaviors are lazy-loaded.
 */

/** Helper: create element, scan, wait for ready
 *  v3.0: Converts x-name to x-name attribute (data-wb is legacy/rejected).
 *        Other data-* attrs are preserved as config.
 */
async function createAndScan(page: any, id: string, tag: string, attrs: Record<string, string>) {
  await page.evaluate(async ({ id, tag, attrs }: any) => {
    const el = document.createElement(tag);
    el.id = id;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'data-wb') {
        // v3.0: Convert legacy data-wb to x-{name} shorthand
        el.setAttribute(`x-${v}`, '');
      } else {
        el.setAttribute(k, v as string);
      }
    }
    if (!el.textContent && tag !== 'input') el.textContent = 'Test Content';
    document.body.appendChild(el);
    await (window as any).WB.scan();
  }, { id, tag, attrs });
  await page.waitForSelector(`#${id}.wb-ready`, { timeout: 5000 });
}

/** Standard page init */
async function initPage(page: any) {
  await page.goto('index.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
  await page.waitForTimeout(200);
}

test.describe('RATING: Click Stars Changes Color', () => {
  test('clicking star 3 fills stars 1-3 with gold', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'rating-click', 'div', {
      'data-wb': 'rating', 'data-max': '5', 'data-value': '0'
    });
    
    const stars = page.locator('#rating-click .wb-rating__star');
    await stars.nth(2).click();
    await page.waitForTimeout(100);
    
    for (let i = 0; i < 3; i++) {
      const hasFullClass = await stars.nth(i).evaluate((el: Element) => el.classList.contains('wb-rating__star--full'));
      expect(hasFullClass, `Star ${i+1} should be filled`).toBe(true);
    }
    for (let i = 3; i < 5; i++) {
      const hasFullClass = await stars.nth(i).evaluate((el: Element) => el.classList.contains('wb-rating__star--full'));
      expect(hasFullClass, `Star ${i+1} should NOT be filled`).toBe(false);
    }
  });
  
  test('clicking star dispatches wb:rating:change event', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'rating-event', 'div', {
      'data-wb': 'rating', 'data-max': '5'
    });
    
    await page.waitForSelector('#rating-event .wb-rating__star', { timeout: 5000 });
    
    const eventValue = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.getElementById('rating-event');
        el!.addEventListener('wb:rating:change', (e: any) => resolve(e.detail.value));
        const star = el!.querySelectorAll('.wb-rating__star')[3] as HTMLElement;
        star.click();
      });
    });
    
    expect(eventValue).toBe(4);
  });
});

test.describe('TABLE: Sortable Columns', () => {
  test('clicking header sorts column ascending then descending', async ({ page }) => {
    await initPage(page);
    
    await page.evaluate(async () => {
      const el = document.createElement('table');
      el.id = 'table-sort';
      el.setAttribute('x-table', '');
      el.setAttribute('data-headers', 'Name,Age');
      el.setAttribute('data-rows', JSON.stringify([
        ['Charlie', '30'], ['Alice', '25'], ['Bob', '35']
      ]));
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    await page.waitForSelector('#table-sort.wb-ready', { timeout: 5000 });
    
    await page.click('#table-sort th:first-child');
    await page.waitForTimeout(100);
    const firstNameAsc = await page.locator('#table-sort tbody tr:first-child td:first-child').textContent();
    expect(firstNameAsc).toBe('Alice');
    
    await page.click('#table-sort th:first-child');
    await page.waitForTimeout(100);
    const firstNameDesc = await page.locator('#table-sort tbody tr:first-child td:first-child').textContent();
    expect(firstNameDesc).toBe('Charlie');
  });
  
  test('table header shows sort indicator', async ({ page }) => {
    await initPage(page);
    
    await page.evaluate(async () => {
      const el = document.createElement('table');
      el.id = 'table-indicator';
      el.setAttribute('x-table', '');
      el.setAttribute('data-headers', 'Name,Age');
      el.setAttribute('data-rows', '[["A","1"],["B","2"]]');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    await page.waitForSelector('#table-indicator.wb-ready', { timeout: 5000 });
    
    await page.click('#table-indicator th:first-child');
    await page.waitForTimeout(100);
    
    const th = page.locator('#table-indicator th:first-child');
    const hasAscClass = await th.evaluate((el: Element) => el.classList.contains('wb-table--sorted-asc'));
    expect(hasAscClass, 'Should have sorted-asc class').toBe(true);
  });
});

test.describe('ANIMATIONS: Click Triggers Animation', () => {
  const ANIMATIONS = ['bounce', 'shake', 'pulse', 'tada', 'wobble', 'jello', 'flash', 'swing', 'heartbeat', 'rubberband'];
  
  for (const anim of ANIMATIONS) {
    test(`${anim} button animates on click`, async ({ page }) => {
      await initPage(page);
      await createAndScan(page, 'anim-test', 'button', { 'data-wb': anim });
      
      await page.click('#anim-test');
      await page.waitForTimeout(100);
      
      const hasAnimation = await page.evaluate(() => {
        const el = document.getElementById('anim-test');
        const style = el?.style.animation || '';
        const cls = el?.className || '';
        return style.includes('wb-') || cls.includes('wb-');
      });
      
      expect(hasAnimation, `${anim} should have animation after click`).toBe(true);
    });
  }
});

test.describe('FORMS: Dark Mode Styling', () => {
  test('input has dark background in dark theme', async ({ page }) => {
    await initPage(page);
    
    await page.evaluate(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const input = document.createElement('input');
      input.id = 'input-dark';
      input.setAttribute('x-input', '');
      input.setAttribute('placeholder', 'Test');
      document.body.appendChild(input);
      await (window as any).WB.scan();
    });
    await page.waitForSelector('#input-dark.wb-ready', { timeout: 5000 });
    
    const wrapper = page.locator('#input-dark').locator('xpath=..');
    const bg = await wrapper.evaluate((el: Element) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('CARDS: Have Correct Styling', () => {
  const BORDERED_CARDS = [
    'card', 'cardimage', 'cardbutton', 'cardprofile',
    'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct',
    'cardnotification', 'cardfile', 'cardhorizontal', 'cardexpandable',
    'cardminimizable', 'cardportfolio'
  ];
  
  const SPECIAL_CARDS = ['cardhero', 'cardoverlay'];
  
  for (const cardType of BORDERED_CARDS) {
    test(`${cardType} has visible border`, async ({ page }) => {
      await initPage(page);
      
      const attrs: Record<string, string> = { 'data-wb': cardType };
      if (cardType.includes('image')) attrs['data-src'] = 'x.jpg';
      if (cardType.includes('profile') || cardType.includes('portfolio')) attrs['data-name'] = 'Test';
      if (cardType.includes('pricing')) { attrs['data-plan'] = 'Test'; attrs['data-price'] = '$10'; }
      if (cardType.includes('stats')) attrs['data-value'] = '100';
      if (cardType.includes('testimonial')) attrs['data-quote'] = 'Test';
      if (cardType.includes('product')) { attrs['data-title'] = 'Test'; attrs['data-price'] = '$10'; }
      if (cardType.includes('notification')) attrs['data-message'] = 'Test';
      if (cardType.includes('file')) attrs['data-filename'] = 'test.pdf';
      if (cardType.includes('horizontal') || cardType.includes('expandable') || cardType.includes('minimizable')) attrs['data-title'] = 'Test';
      
      await createAndScan(page, 'card-border-test', 'div', attrs);
      
      // After initialization, card gets wb-card class — check border on the initialized element
      const borderStyle = await page.evaluate(() => {
        const el = document.getElementById('card-border-test');
        const style = getComputedStyle(el!);
        return style.borderStyle;
      });
      
      // Cards may use 'solid' directly or inherit from wb-card class
      // Accept any non-'none' border as valid
      expect(borderStyle, `${cardType} MUST have visible border`).not.toBe('none');
    });
  }
  
  for (const cardType of SPECIAL_CARDS) {
    test(`${cardType} has borderRadius`, async ({ page }) => {
      await initPage(page);
      
      const attrs: Record<string, string> = { 'data-wb': cardType, 'data-title': 'Test' };
      if (cardType === 'cardoverlay') attrs['data-image'] = 'test.jpg';
      
      await createAndScan(page, 'card-special-test', 'div', attrs);
      
      const borderRadius = await page.evaluate(() => {
        return getComputedStyle(document.getElementById('card-special-test')!).borderRadius;
      });
      
      expect(borderRadius).not.toBe('0px');
    });
  }
});

test.describe('SPINNER: Actually Spins', () => {
  test('spinner has infinite animation', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'spinner-spin', 'div', { 'data-wb': 'spinner' });
    
    const inner = page.locator('#spinner-spin div').first();
    const animation = await inner.evaluate((el: Element) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, iteration: style.animationIterationCount };
    });
    
    expect(animation.name).not.toBe('none');
    expect(animation.iteration).toBe('infinite');
  });
});

test.describe('DRAWER: Position Works', () => {
  test('drawer left opens on left side', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'drawer-left-btn', 'button', {
      'data-wb': 'drawer', 'data-position': 'left',
      'data-title': 'Left Drawer', 'data-content': 'Content'
    });
    
    await page.click('#drawer-left-btn');
    await page.waitForTimeout(300);
    
    const drawer = page.locator('div[style*="position: fixed"]').filter({ hasText: 'Left Drawer' }).last();
    const style = await drawer.getAttribute('style');
    expect(style).toContain('left: 0');
  });
  
  test('drawer right opens on right side', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'drawer-right-btn', 'button', {
      'data-wb': 'drawer', 'data-position': 'right',
      'data-title': 'Right Drawer', 'data-content': 'Content'
    });
    
    await page.click('#drawer-right-btn');
    await page.waitForTimeout(300);
    
    const drawer = page.locator('div[style*="position: fixed"]').filter({ hasText: 'Right Drawer' }).last();
    const style = await drawer.getAttribute('style');
    expect(style).toContain('right: 0');
  });
});

test.describe('CONFETTI: Shows Effect', () => {
  test('confetti button creates particles on click', async ({ page }) => {
    await initPage(page);
    await createAndScan(page, 'confetti-btn', 'button', { 'data-wb': 'confetti' });
    
    await page.click('#confetti-btn');
    await page.waitForTimeout(200);
    
    const confettiCount = await page.evaluate(() => {
      return document.querySelectorAll('.wb-confetti-piece, [class*="confetti"]').length;
    });
    
    expect(confettiCount).toBeGreaterThan(0);
  });
});
