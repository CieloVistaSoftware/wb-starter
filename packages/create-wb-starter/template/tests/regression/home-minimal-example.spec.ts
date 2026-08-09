import { expect, test } from '@playwright/test';

test('home page highlights the one-script minimal example', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /one script/i })).toBeVisible();
  await expect(page.getByText(/start with two stylesheets/i)).toBeVisible();
  await expect(page.getByText('Two stylesheets. One module script. Auto-inject enabled. Done.')).toBeVisible();
});
