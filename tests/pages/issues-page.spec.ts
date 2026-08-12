import { test, expect } from '@playwright/test';

test.describe('Issues page', () => {
  test('shows the current active count from status:in-progress labels', async ({ page }) => {
    await page.route(/https:\/\/api\.github\.com\/repos\/CieloVistaSoftware\/wb-starter\/issues(?:\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            number: 517,
            title: 'Running job',
            state: 'open',
            created_at: '2026-08-01T00:00:00Z',
            labels: [{ name: 'status:in-progress', color: '2da44e' }],
            body: '',
          },
          {
            number: 516,
            title: 'Completed job',
            state: 'closed',
            created_at: '2026-07-01T00:00:00Z',
            closed_at: '2026-08-02T00:00:00Z',
            labels: [{ name: 'enhancement', color: 'a2eeef' }],
            body: '',
          },
        ]),
      });
    });

    const issuesResponse = page.waitForResponse((response) =>
      response.url().startsWith('https://api.github.com/repos/CieloVistaSoftware/wb-starter/issues')
    );
    await page.goto('/?page=issues');
    expect((await issuesResponse).status()).toBe(200);

    await expect(page.locator('#issues-active')).toHaveText('Current Active: 1');
  });
});