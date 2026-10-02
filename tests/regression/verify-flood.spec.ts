import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

test('Should not flood network with requests', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));

  await page.goto('/tests/fixtures/repro/flood.html');
  
  // Wait for cards to be processed
  await wbIdle(page);

  // Count requests for card.js
  const cardRequests = requests.filter(url => url.includes('card.js'));
  console.log(`Total card.js requests: ${cardRequests.length}`);

  // Should be exactly 1
  expect(cardRequests.length).toBe(1);
});
