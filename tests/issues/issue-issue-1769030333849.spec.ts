/**
 * Issue Test: issue-1769030333849
 * BUG: The card with a footer does not show the footer
 */
import { test, expect } from '@playwright/test';

test.describe('Issue issue-1769030333849: Card Footer Not Showing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=components');
    await page.waitForLoadState('networkidle');
  });

  test('card component should display footer when provided', async ({ page }) => {
    // Find cards with footers on the page
    const cardsWithFooter = page.locator('[wb="card"]:has(footer), wb-card:has(footer), .card:has(footer)');
    
    if (await cardsWithFooter.count() > 0) {
      const card = cardsWithFooter.first();
      const footer = card.locator('footer, .card-footer, [slot="footer"]');
      
      // Footer should be visible
      await expect(footer).toBeVisible();
      
      // Footer should have content
      const footerText = await footer.textContent();
      expect(footerText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('programmatically created card should show footer', async ({ page }) => {
    // Create a card with footer programmatically
    await page.evaluate(() => {
      const container = document.getElementById('canvas') || document.body;
      
      const card = document.createElement('div');
      card.setAttribute('wb', 'card');
      card.innerHTML = `
        <header>Card Header</header>
        <div class="card-body">Card Content</div>
        <footer>Card Footer Text</footer>
      `;
      card.id = 'test-card-footer';
      container.appendChild(card);
    });

    const card = page.locator('#test-card-footer');
    await expect(card).toBeVisible();

    const footer = card.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText('Card Footer Text');
  });

  test('card footer should not be hidden by CSS', async ({ page }) => {
    // Check CSS doesn't hide footer
    await page.evaluate(() => {
      const card = document.createElement('div');
      card.setAttribute('wb', 'card');
      card.innerHTML = '<footer id="check-footer">Test Footer</footer>';
      document.body.appendChild(card);
    });

    const footer = page.locator('#check-footer');
    
    // Check computed styles
    const styles = await footer.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height
      };
    });

    // Footer should not be hidden
    expect(styles.display).not.toBe('none');
    expect(styles.visibility).not.toBe('hidden');
    expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
  });

  test('card footer should have proper layout', async ({ page }) => {
    await page.evaluate(() => {
      const container = document.body;
      container.innerHTML += `
        <div wb="card" id="layout-test-card" style="width: 300px;">
          <header>Header</header>
          <div class="body">Body content here</div>
          <footer>Footer content</footer>
        </div>
      `;
    });

    const card = page.locator('#layout-test-card');
    const footer = card.locator('footer');

    await expect(card).toBeVisible();
    await expect(footer).toBeVisible();

    // Footer should be at the bottom of the card
    const cardBox = await card.boundingBox();
    const footerBox = await footer.boundingBox();

    if (cardBox && footerBox) {
      // Footer bottom should be near card bottom
      const cardBottom = cardBox.y + cardBox.height;
      const footerBottom = footerBox.y + footerBox.height;
      
      expect(footerBottom).toBeCloseTo(cardBottom, -1); // Within ~10px
    }
  });

  test('all card variants should support footer', async ({ page }) => {
    const cardVariants = ['card', 'card-bordered', 'card-elevated'];
    
    for (const variant of cardVariants) {
      await page.evaluate((v) => {
        const card = document.createElement('div');
        card.setAttribute('wb', v);
        card.className = `test-${v}`;
        card.innerHTML = `<footer>${v} Footer</footer>`;
        document.body.appendChild(card);
      }, variant);

      const footer = page.locator(`.test-${variant} footer`);
      
      // Each variant should show footer
      await expect(footer).toBeVisible();
    }
  });
});
