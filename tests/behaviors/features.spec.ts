import { test, expect } from '@playwright/test';

test('wb-features renders header and subtitle', async ({ page }) => {
  await page.goto('/?page=home');
  await page.waitForSelector('wb-features');
  const title = await page.locator('wb-features .section-title').innerText();
  const subtitle = await page.locator('wb-features .section-subtitle').innerText();
  expect(title.trim()).toBe('Everything You Need');
  expect(subtitle.trim()).toBe('A complete toolkit for modern web development.');
});

test('wb-features contains six feature cards', async ({ page }) => {
  await page.goto('/?page=home');
  await page.waitForSelector('wb-features');
  const cards = await page.locator('wb-features wb-card');
  await expect(cards).toHaveCount(6);
});