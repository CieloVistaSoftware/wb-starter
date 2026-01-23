  // ==========================================
  // OPENING BEHAVIOR TEST
  // ==========================================
  test('notes must not open until notes button clicked', async ({ page }) => {
    await injectNotes(page, '<div wb="notes"></div>');
    const notes = page.locator('#test-container [wb="notes"]');
    // Should not be open initially
    await expect(notes).not.toHaveClass(/wb-notes--open/);
    // Simulate clicking the open button (assume a button exists to open notes)
    await page.evaluate(() => {
      const el = document.querySelector('wb-notes, [wb="notes"]');
      el.wbNotes.open();
    });
    await expect(notes).toHaveClass(/wb-notes--open/);
  });
import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/index.html';

test.describe('Notes Behavior', () => {
  async function injectNotes(page: Page, html: string) {
    await page.goto(BASE_URL);
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      () => (window as any).WBSite && (window as any).WBSite.currentPage,
      { timeout: 10000 }
    );
    await page.waitForTimeout(100);
    
    // Clear localStorage to prevent state interference
    await page.evaluate(() => localStorage.clear());

    await page.evaluate((html: string) => {
      const existing = document.getElementById('test-container');
      if (existing) existing.remove();
      
      const container = document.createElement('div');
      container.id = 'test-container';
      container.innerHTML = html;
      document.body.appendChild(container);
    }, html);
    
    await page.evaluate(() => {
      (window as any).WB.scan(document.getElementById('test-container'));
    });
    
    await page.waitForTimeout(50);
  }

  // ==========================================
  // STRUCTURE TESTS
  // ==========================================
  test.describe('Structure', () => {
    test('should add wb-notes class to element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes/);
    });

    test('should create backdrop element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const backdrop = page.locator('#test-container .wb-notes__backdrop');
      await expect(backdrop).toBeAttached();
    });

    test('should create drawer element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const drawer = page.locator('#test-container .wb-notes__drawer');
      await expect(drawer).toBeAttached();
    });

    test('should create header element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const header = page.locator('#test-container .wb-notes__header');
      await expect(header).toBeAttached();
    });

    test('should create textarea element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const textarea = page.locator('#test-container .wb-notes__textarea');
      await expect(textarea).toBeAttached();
    });

    test('should create footer element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const footer = page.locator('#test-container .wb-notes__footer');
      await expect(footer).toBeAttached();
    });

    test('should create status element in footer', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toBeAttached();
    });
  });

  // ==========================================
  // BUTTON TESTS
  // ==========================================
  test.describe('Buttons', () => {
    test('should have collapse left button («)', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[action="collapse-left"]');
      await expect(btn).toBeAttached();
      await expect(btn).toHaveText('«');
    });

    test('should have collapse right button (»)', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[action="collapse-right"]');
      await expect(btn).toBeAttached();
      await expect(btn).toHaveText('»');
    });

    test('should have left position button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="left"]');
      await expect(btn).toBeAttached();
    });

    test('should have modal position button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="modal"]');
      await expect(btn).toBeAttached();
    });

    test('should have right position button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="right"]');
      await expect(btn).toBeAttached();
    });

    test('should have copy button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[action="copy"]');
      await expect(btn).toBeAttached();
    });

    test('should have save button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[action="save"]');
      await expect(btn).toBeAttached();
    });

    test('should have close button', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[action="close"]');
      await expect(btn).toBeAttached();
    });

    test('should have clear button in footer', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const btn = page.locator('#test-container .wb-notes__footer .wb-notes__wide-btn[action="clear"]');
      await expect(btn).toBeAttached();
    });
  });

  // ==========================================
  // POSITION TESTS
  // ==========================================
  test.describe('Position', () => {
    test('should default to left position', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--left/);
    });

    test('should respect position="right"', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="right"></div>');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--right/);
    });

    test('should respect position="modal"', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="modal"></div>');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--modal/);
    });

    test('should mark left button active when position is left', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="left"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="left"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('should mark right button active when position is right', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="right"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="right"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('should mark modal button active when position is modal', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="modal"></div>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[pos="modal"]');
      await expect(btn).toHaveClass(/active/);
    });
  });

  // ==========================================
  // OPEN/CLOSE TESTS
  // ==========================================
  test.describe('Open/Close', () => {
    test('should add wb-notes--open class when opened via API', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
      });
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--open/);
    });

    test('should remove wb-notes--open class when closed via API', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
        el.wbNotes.close();
      });
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });

    test('should toggle open state via API', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.toggle();
      });
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--open/);
    });

    test('close button should close drawer', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__wide-btn[action="close"]');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });

  // ==========================================
  // COLLAPSE TESTS
  // ==========================================
  test.describe('Collapse Arrows', () => {
    test('collapse left button should set position to left and close', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="right"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__wide-btn[action="collapse-left"]');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--left/);
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });

    test('collapse right button should set position to right and close', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="left"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__wide-btn[action="collapse-right"]');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).toHaveClass(/wb-notes--right/);
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });

  // ==========================================
  // SAVE TESTS (Duplicate Prevention)
  // ==========================================
  test.describe('Save with Duplicate Prevention', () => {
    test('should show warning when no content to save', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.click('#test-container .wb-notes__wide-btn[action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('No notes to save');
    });

    test('should show success when saving content', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.fill('#test-container .wb-notes__textarea', 'Test note content ' + Date.now());
      await page.click('#test-container .wb-notes__wide-btn[action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('Saved');
    });

    test('should prevent duplicate content on second save', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const content = 'Duplicate test ' + Date.now();
      
      // First save
      await page.fill('#test-container .wb-notes__textarea', content);
      await page.click('#test-container .wb-notes__wide-btn[action="save"]');
      await page.waitForTimeout(100);
      
      // Second save with same content
      await page.click('#test-container .wb-notes__wide-btn[action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('duplicate');
    });
  });

  // ==========================================
  // COPY TESTS
  // ==========================================
  test.describe('Copy', () => {
    test('should show warning when no content to copy', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.click('#test-container .wb-notes__wide-btn[action="copy"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('No notes to copy');
    });
  });

  // ==========================================
  // CLEAR TESTS
  // ==========================================
  test.describe('Clear', () => {
    test('clear button should be in footer', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const clearInFooter = page.locator('#test-container .wb-notes__footer .wb-notes__wide-btn--clear');
      await expect(clearInFooter).toBeAttached();
    });

    test('clear button should have "Clear" text', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const clearBtn = page.locator('#test-container .wb-notes__wide-btn[action="clear"]');
      await expect(clearBtn).toContainText('Clear');
    });
  });

  // ==========================================
  // API TESTS
  // ==========================================
  test.describe('API', () => {
    test('should expose wbNotes object on element', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasApi = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes === 'object';
      });
      expect(hasApi).toBe(true);
    });

    test('should have open method', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes.open === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have close method', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes.close === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have toggle method', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes.toggle === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have setPosition method', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes.setPosition === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have collapseToSide method', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return typeof el.wbNotes.collapseToSide === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('content property should get/set textarea value', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const content = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.content = 'Test content';
        return el.wbNotes.content;
      });
      expect(content).toBe('Test content');
    });

    test('isOpen property should reflect state', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      const states = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        const before = el.wbNotes.isOpen;
        el.wbNotes.open();
        const after = el.wbNotes.isOpen;
        return { before, after };
      });
      expect(states.before).toBe(false);
      expect(states.after).toBe(true);
    });

    test('position property should reflect current position', async ({ page }) => {
      await injectNotes(page, '<div wb="notes" position="right"></div>');
      const position = await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        return el.wbNotes.position;
      });
      expect(position).toBe('right');
    });
  });

  // ==========================================
  // KEYBOARD TESTS
  // ==========================================
  test.describe('Keyboard', () => {
    test('Escape key should close drawer', async ({ page }) => {
      await injectNotes(page, '<div wb="notes"></div>');
      await page.evaluate(() => {
        const el = document.querySelector('[wb="notes"]') as any;
        el.wbNotes.open();
      });
      await page.keyboard.press('Escape');
      const notes = page.locator('#test-container [wb="notes"]');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });
});
