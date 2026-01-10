import { test, expect } from '@playwright/test';

test.describe('Builder Section Synchronization', () => {
  test('sections sync between Tree and Canvas', async ({ page }) => {
    // 1. Initial Load - Default to Header Active
    await page.goto('/builder.html');
    
    // Wait for initialization
    await page.waitForTimeout(500);

    // Verify Initial State (Header)
    const treeHeader = page.locator('.page-section[data-section="header"]');
    const canvasHeader = page.locator('#canvas-header');
    const tbHeader = page.locator('.tb-site-section[data-section="header"]');
    
    // Tree (Right): Should have 'active' class
    await expect(treeHeader).toHaveClass(/active/);
    
    // Canvas: Should have 'is-target' and NOT 'collapsed'
    await expect(canvasHeader).toHaveClass(/is-target/);
    await expect(canvasHeader).not.toHaveClass(/collapsed/);
    
    // Template Browser (Left): Should be active and expanded
    await expect(tbHeader).toHaveClass(/filtered-active/);
    await expect(tbHeader).not.toHaveClass(/collapsed/);
    // Explicitly check for Green color (#22c55e -> rgb(34, 197, 94))
    const tbHeaderButton = tbHeader.locator('.tb-section-header');
    await expect(tbHeaderButton).toHaveCSS('background-color', 'rgb(34, 197, 94)');
    // Also check the container border is green to ensure "whole" section is highlighted
    await expect(tbHeader).toHaveCSS('border-color', 'rgb(34, 197, 94)');

    // Check others are not active
    const canvasMain = page.locator('#canvas-main');
    await expect(canvasMain).not.toHaveClass(/is-target/);
    await expect(canvasMain).toHaveClass(/collapsed/); // Typically starts collapsed

    // 2. Action: Click "Main" in Tree
    const treeMain = page.locator('.page-section[data-section="main"] .page-section-header');
    await treeMain.click();

    // Verify Transition
    await expect(treeHeader).not.toHaveClass(/active/);
    await expect(canvasHeader).not.toHaveClass(/is-target/);
    await expect(tbHeader).not.toHaveClass(/filtered-active/);
    
    const treeMainSection = page.locator('.page-section[data-section="main"]');
    await expect(treeMainSection).toHaveClass(/active/);
    
    await expect(canvasMain).toHaveClass(/is-target/);
    await expect(canvasMain).not.toHaveClass(/collapsed/);
    
    const tbMain = page.locator('.tb-site-section[data-section="main"]');
    await expect(tbMain).toHaveClass(/filtered-active/);

    // 3. Action: Click "Footer" in Canvas (if clickable) or Tree
    // Let's use the Tree again to verify scrolling logic or switching back
    const treeFooter = page.locator('.page-section[data-section="footer"] .page-section-header');
    await treeFooter.click();
    
    const canvasFooter = page.locator('#canvas-footer');
    await expect(canvasFooter).toHaveClass(/is-target/);
    
    // Verify scroll position (Footer should be near bottom, so scrollTop > 0)
    const viewport = page.locator('#viewport');
    const scrollTop = await viewport.evaluate(el => el.scrollTop);
    console.log('Scroll Top after Footer Click:', scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('all container elements must have an id', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // 1. Check structural canvas sections
    const structuralSections = ['#canvas-header', '#canvas-main', '#canvas-footer'];
    for (const selector of structuralSections) {
      await expect(page.locator(selector)).toHaveAttribute('id', /.+/);
    }

    // 2. Check all potential container elements on the canvas
    const containersWithoutIds = await page.evaluate(() => {
        // Logic to identify containers (matches builder-tree.js)
        const isContainer = (el) => {
            const c = JSON.parse(el.dataset.c || '{}');
            return el.classList.contains('is-container') || 
                   c.t === 'section' || 
                   c.b === 'container' || 
                   c.b === 'grid';
        };

        const allDropped = Array.from(document.querySelectorAll('.dropped'));
        
        return allDropped
            .filter(isContainer)
            .filter(el => !el.id || el.id.trim() === '')
            .map(el => ({
                tagName: el.tagName,
                className: el.className,
                dataset: el.dataset
            }));
    });

    expect(containersWithoutIds, 
      `Found ${containersWithoutIds.length} container(s) without IDs: ${JSON.stringify(containersWithoutIds)}`
    ).toHaveLength(0);
  });

  test('all button elements on canvas must have an id', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // 1. Inject a button to ensure we have content to test
    await page.evaluate(() => {
        if (window.addHTML) {
            window.addHTML('<button class="btn">Test Button</button>');
        }
    });
    await page.waitForTimeout(500);

    const buttonsWithoutIds = await page.evaluate(() => {
        // Scan for ALL button elements within the canvas
        // This covers both wrappers that are buttons and inner buttons
        const canvas = document.getElementById('canvas');
        if (!canvas) return [];

        // Select all actual button elements or elements with button role/class
        const candidates = Array.from(canvas.querySelectorAll('button, .btn, [role="button"]'));

        return candidates
            .filter(el => !el.id || el.id.trim() === '')
            .map(el => ({
                tagName: el.tagName,
                className: el.className,
                text: el.innerText.substring(0, 20)
            }));
    });

    // Ensure we actually checked something
    const buttonCount = await page.evaluate(() => {
        const canvas = document.getElementById('canvas');
        return canvas ? canvas.querySelectorAll('button, .btn, [role="button"]').length : 0;
    });
    expect(buttonCount, 'Test setup failed: No buttons found on canvas').toBeGreaterThan(0);

    expect(buttonsWithoutIds, 
      `Found ${buttonsWithoutIds.length} button(s) without IDs: ${JSON.stringify(buttonsWithoutIds)}`
    ).toHaveLength(0);
  });

  test('all buttons in template browser must have an id', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500); // Wait for sidebar to render

    const tbButtonsWithoutIds = await page.evaluate(() => {
        const tb = document.querySelector('.template-browser');
        if (!tb) return [];
        
        return Array.from(tb.querySelectorAll('button'))
            .filter(el => !el.id || el.id.trim() === '')
            .map(el => ({
                className: el.className,
                text: el.innerText.substring(0, 20)
            }));
    });

    expect(tbButtonsWithoutIds, 
      `Found ${tbButtonsWithoutIds.length} buttons in Template Browser without IDs: ${JSON.stringify(tbButtonsWithoutIds)}`
    ).toHaveLength(0);
  });
});
