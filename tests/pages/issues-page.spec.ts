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

    // #978: assert the FIXTURE was actually served before asserting anything
    // derived from it. This test passed alone and failed in the full suite with
    // "Current Active: 4" — the live count of open priority:1 issues — because
    // the interception did not take effect and real API data rendered instead.
    // Checking a canned issue first turns that into a failure that names its own
    // cause, rather than a number mismatch that looks like a broken page.
    await expect(
      page.locator('.issue-row[data-number="517"]'),
      'the route fixture was not served — the page rendered live GitHub data'
    ).toBeAttached({ timeout: 10000 });

    // Derived from the fixture (one open issue labelled status:in-progress),
    // not remembered. The page counts status:in-progress OR priority:1.
    await expect(page.locator('#issues-active')).toHaveText('Current Active: 1');
  });
});