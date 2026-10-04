import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1188: time.md section 3 promises that x-timeline keeps hand-written
 * entries (real <time> elements) as written. timeline.js instead took the
 * text of everything inside, split it on commas, cleared the element and
 * built one plain div per piece, so the <time> was thrown away.
 *
 * The markup tested here is read from the doc itself, so the doc and the
 * behavior cannot disagree again without this failing.
 */
function docTimelineMarkup(): string {
  const md = fs.readFileSync(path.join(process.cwd(), 'docs/behaviors/time.md'), 'utf8').replace(/\r\n/g, '\n');
  const section = md.split(/^### 3\. Timeline Behavior/m)[1]?.split(/^### /m)[0] ?? '';
  const start = section.indexOf('<div x-timeline>');
  const end = section.indexOf('</article>\n</div>', start);
  expect(start, 'time.md section 3 still shows a <div x-timeline> demo').toBeGreaterThan(-1);
  expect(end, 'time.md section 3 demo closes its timeline').toBeGreaterThan(start);
  return section.slice(start, end + '</article>\n</div>'.length);
}

async function render(page, html: string) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  await page.evaluate(async (markup) => {
    const host = document.createElement('div');
    host.id = 'timeline-host-1188';
    host.innerHTML = markup;
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
  const timeline = page.locator('#timeline-host-1188 [x-timeline]');
  await expect(timeline).toHaveAttribute('x-ready', '');
  return timeline;
}

test.describe('x-timeline keeps hand-written entries (#1188)', () => {
  test('the time.md section 3 demo keeps its <time> and heading', async ({ page }) => {
    const timeline = await render(page, docTimelineMarkup());
    await expect(timeline.locator('time[datetime="2024-01"]')).toHaveCount(1);
    await expect(timeline.locator('article.x-timeline__item h4')).toHaveText('Project Started');
    await expect(timeline.locator('.x-timeline-item')).toHaveCount(0);
  });

  test('plain comma-separated text is still built into items', async ({ page }) => {
    const timeline = await render(page, '<div x-timeline>Kickoff, Launch, Review</div>');
    await expect(timeline.locator('.x-timeline-item')).toHaveText(['Kickoff', 'Launch', 'Review']);
  });

  test('an items attribute still wins over authored content', async ({ page }) => {
    const timeline = await render(page, '<div x-timeline items="One, Two"><article>ignored</article></div>');
    await expect(timeline.locator('.x-timeline-item')).toHaveText(['One', 'Two']);
  });
});
