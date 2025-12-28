import { test, expect } from '@playwright/test';

/**
 * BEHAVIOR VERIFICATION TESTS v2
 * ==============================
 * Tests ACTUAL behavior, not just classes.
 */

test.describe('RATING: Click Stars Changes Color', () => {
  test('clicking star 3 fills stars 1-3 with gold', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'rating-click';
      el.setAttribute('data-wb', 'rating');
      el.setAttribute('data-max', '5');
      el.setAttribute('data-value', '0');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    // Click the 3rd star
    const stars = page.locator('#rating-click .wb-rating__star');
    await stars.nth(2).click();
    
    // First 3 stars should be filled (gold color)
    for (let i = 0; i < 3; i++) {
      const star = stars.nth(i);
      const hasFullClass = await star.evaluate(el => el.classList.contains('wb-rating__star--full'));
      expect(hasFullClass, `Star ${i+1} should be filled`).toBe(true);
    }
    
    // Stars 4 and 5 should NOT be filled
    for (let i = 3; i < 5; i++) {
      const star = stars.nth(i);
      const hasFullClass = await star.evaluate(el => el.classList.contains('wb-rating__star--full'));
      expect(hasFullClass, `Star ${i+1} should NOT be filled`).toBe(false);
    }
  });
  
  test('clicking star dispatches wb:rating:change event', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    // Create element and scan
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'rating-event';
      el.setAttribute('data-wb', 'rating');
      el.setAttribute('data-max', '5');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    // Wait for stars to be rendered
    await page.waitForSelector('#rating-event .wb-rating__star', { timeout: 5000 });
    
    // Set up event listener and click
    const eventValue = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.getElementById('rating-event');
        el.addEventListener('wb:rating:change', (e: any) => {
          resolve(e.detail.value);
        });
        
        // Click 4th star
        const star = el.querySelectorAll('.wb-rating__star')[3] as HTMLElement;
        star.click();
      });
    });
    
    expect(eventValue).toBe(4);
  });
});

test.describe('TABLE: Sortable Columns', () => {
  test('clicking header sorts column ascending then descending', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('table');
      el.id = 'table-sort';
      el.setAttribute('data-wb', 'table');
      el.setAttribute('data-headers', 'Name,Age');
      el.setAttribute('data-rows', JSON.stringify([
        ['Charlie', '30'],
        ['Alice', '25'],
        ['Bob', '35']
      ]));
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    // Click Name header to sort ascending
    await page.click('#table-sort th:first-child');
    await page.waitForTimeout(50);
    
    // First row should now be Alice
    const firstNameAfterSort = await page.locator('#table-sort tbody tr:first-child td:first-child').textContent();
    expect(firstNameAfterSort).toBe('Alice');
    
    // Click again to sort descending
    await page.click('#table-sort th:first-child');
    await page.waitForTimeout(50);
    
    // First row should now be Charlie
    const firstNameDesc = await page.locator('#table-sort tbody tr:first-child td:first-child').textContent();
    expect(firstNameDesc).toBe('Charlie');
  });
  
  test('table header shows sort indicator', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('table');
      el.id = 'table-indicator';
      el.setAttribute('data-wb', 'table');
      el.setAttribute('data-headers', 'Name,Age');
      el.setAttribute('data-rows', '[["A","1"],["B","2"]]');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    await page.click('#table-indicator th:first-child');
    await page.waitForTimeout(50);
    
    const th = page.locator('#table-indicator th:first-child');
    const hasAscClass = await th.evaluate(el => el.classList.contains('wb-table--sorted-asc'));
    expect(hasAscClass, 'Should have sorted-asc class').toBe(true);
  });
});

test.describe('ANIMATIONS: Click Triggers Animation', () => {
  const ANIMATIONS = ['bounce', 'shake', 'pulse', 'tada', 'wobble', 'jello', 'flash', 'swing', 'heartbeat', 'rubberband'];
  
  for (const anim of ANIMATIONS) {
    test(`${anim} button animates on click`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
      await page.waitForTimeout(100);
      
      await page.evaluate((animName: string) => {
        const btn = document.createElement('button');
        btn.id = 'anim-test';
        btn.setAttribute('data-wb', animName);
        btn.textContent = animName;
        document.body.appendChild(btn);
        (window as any).WB.scan();
      }, anim);
      
      // Click the button
      await page.click('#anim-test');
      await page.waitForTimeout(50);
      
      // Check animation style is set
      const hasAnimation = await page.evaluate(() => {
        const el = document.getElementById('anim-test');
        const style = el?.style.animation || '';
        return style.includes('wb-');
      });
      
      expect(hasAnimation, `${anim} should have animation after click`).toBe(true);
    });
  }
});

test.describe('FORMS: Dark Mode Styling', () => {
  test('input has dark background in dark theme', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const input = document.createElement('input');
      input.id = 'input-dark';
      input.setAttribute('data-wb', 'input');
      input.setAttribute('placeholder', 'Test');
      document.body.appendChild(input);
      (window as any).WB.scan();
    });
    
    const wrapper = page.locator('#input-dark').locator('xpath=..');
    const bg = await wrapper.evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Should NOT be white (light mode)
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('CARDS: Have Correct Styling', () => {
  // Cards that MUST have solid borders (standard cards)
  const BORDERED_CARDS = [
    'card', 'cardimage', 'cardbutton', 'cardprofile',
    'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct',
    'cardnotification', 'cardfile', 'cardhorizontal', 'cardexpandable',
    'cardminimizable', 'cardportfolio'
  ];
  
  // Cards that DON'T have full borders (hero/overlay use different styling)
  const SPECIAL_CARDS = ['cardhero', 'cardoverlay'];
  
  for (const cardType of BORDERED_CARDS) {
    test(`${cardType} has visible border`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
      await page.waitForTimeout(100);
      
      await page.evaluate((type: string) => {
        const el = document.createElement('div');
        el.id = 'card-border-test';
        el.setAttribute('data-wb', type);
        // Add minimal required attributes
        if (type.includes('image')) el.setAttribute('data-src', 'x.jpg');
        if (type.includes('profile') || type.includes('portfolio')) el.setAttribute('data-name', 'Test');
        if (type.includes('pricing')) { el.setAttribute('data-plan', 'Test'); el.setAttribute('data-price', '$10'); }
        if (type.includes('stats')) el.setAttribute('data-value', '100');
        if (type.includes('testimonial')) el.setAttribute('data-quote', 'Test');
        if (type.includes('product')) { el.setAttribute('data-title', 'Test'); el.setAttribute('data-price', '$10'); }
        if (type.includes('notification')) el.setAttribute('data-message', 'Test');
        if (type.includes('file')) el.setAttribute('data-filename', 'test.pdf');
        if (type.includes('horizontal') || type.includes('expandable') || type.includes('minimizable')) el.setAttribute('data-title', 'Test');
        el.textContent = 'Content';
        document.body.appendChild(el);
        (window as any).WB.scan();
      }, cardType);
      
      await page.waitForTimeout(50);
      
      const card = page.locator('#card-border-test');
      const borderStyle = await card.evaluate(el => getComputedStyle(el).borderStyle);
      
      expect(borderStyle, `${cardType} MUST have solid border`).toBe('solid');
    });
  }
  
  for (const cardType of SPECIAL_CARDS) {
    test(`${cardType} has borderRadius`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
      await page.waitForTimeout(100);
      
      await page.evaluate((type: string) => {
        const el = document.createElement('div');
        el.id = 'card-special-test';
        el.setAttribute('data-wb', type);
        el.setAttribute('data-title', 'Test');
        if (type === 'cardoverlay') el.setAttribute('data-image', 'test.jpg');
        el.textContent = 'Content';
        document.body.appendChild(el);
        (window as any).WB.scan();
      }, cardType);
      
      await page.waitForTimeout(50);
      
      const card = page.locator('#card-special-test');
      const borderRadius = await card.evaluate(el => getComputedStyle(el).borderRadius);
      
      // Should have some border radius
      expect(borderRadius).not.toBe('0px');
    });
  }
});

test.describe('SPINNER: Actually Spins', () => {
  test('spinner has infinite animation', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'spinner-spin';
      el.setAttribute('data-wb', 'spinner');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const inner = page.locator('#spinner-spin div').first();
    const animation = await inner.evaluate(el => {
      const style = getComputedStyle(el);
      return {
        name: style.animationName,
        iteration: style.animationIterationCount
      };
    });
    
    expect(animation.name).not.toBe('none');
    expect(animation.iteration).toBe('infinite');
  });
});

test.describe('DRAWER: Position Works', () => {
  test('drawer left opens on left side', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'drawer-left-btn';
      btn.setAttribute('data-wb', 'drawer');
      btn.setAttribute('data-position', 'left');
      btn.setAttribute('data-title', 'Left Drawer');
      btn.setAttribute('data-content', 'Content');
      document.body.appendChild(btn);
      (window as any).WB.scan();
    });
    
    await page.click('#drawer-left-btn');
    await page.waitForTimeout(300);
    
    // Find the drawer panel
    const drawer = page.locator('div[style*="position: fixed"]').filter({ hasText: 'Left Drawer' }).last();
    const style = await drawer.getAttribute('style');
    
    expect(style).toContain('left: 0');
  });
  
  test('drawer right opens on right side', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'drawer-right-btn';
      btn.setAttribute('data-wb', 'drawer');
      btn.setAttribute('data-position', 'right');
      btn.setAttribute('data-title', 'Right Drawer');
      btn.setAttribute('data-content', 'Content');
      document.body.appendChild(btn);
      (window as any).WB.scan();
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
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'confetti-btn';
      btn.setAttribute('data-wb', 'confetti');
      btn.textContent = 'Confetti';
      document.body.appendChild(btn);
      (window as any).WB.scan();
    });
    
    await page.click('#confetti-btn');
    await page.waitForTimeout(100);
    
    // Check if confetti elements were created
    const confettiCount = await page.evaluate(() => {
      return document.querySelectorAll('.wb-confetti-piece, [class*="confetti"]').length;
    });
    
    // Should have created some confetti elements
    expect(confettiCount).toBeGreaterThan(0);
  });
});
