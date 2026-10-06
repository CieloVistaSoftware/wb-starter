import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * ONE WORD, ONE PLACEMENT (#968)
 * ==============================
 * John: "each word has specific placement and meaning."
 *
 * `description` rendered as the subtitle on cardproduct and cardvideo and as
 * .x-card__description on cardlink, and cardlink put a `subtitle` into the
 * description slot. Now `subtitle` is always the line under the title, and
 * `description` is always .x-card__description.
 *
 * The text between the tags is the card's content: a `content="…"` attribute
 * is only a fallback, and the schema builder calls it content (it was `slot`,
 * Web Components vocabulary, aliased to `body`).
 */
const CASES = [
  'x-cardproduct price="$9"',
  'x-cardvideo',
  'x-cardlink href="#"',
];

test('the subtitle sits under the title and the description is .x-card__description, on every card that takes both', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.scan, null, { timeout: 20_000 });
  const results = await page.evaluate(async (cases) => {
    const box = document.createElement('div');
    box.innerHTML = cases.map((c: string, i: number) =>
      `<article id="c${i}" ${c} title="Title" subtitle="The subtitle" description="The description"></article>`).join('');
    document.body.appendChild(box);
    await (window as any).WB.scan(box, { eager: true });
    await (window as any).WB.settled({ timeout: 5000 });
    return cases.map((c: string, i: number) => {
      const card = document.getElementById(`c${i}`)!;
      const leaves = (t: string) => [...card.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent!.trim() === t);
      return {
        card: c.split(' ')[0],
        // The line under the title: the title's next sibling, whatever its tag.
        subtitle: leaves('The subtitle').map((e) => e.previousElementSibling?.textContent?.trim() === 'Title' ? 'under the title' : `in ${e.className || e.tagName}`),
        description: leaves('The description').map((e) => (e.classList.contains('x-card__description') ? '.x-card__description' : `in ${e.className || e.tagName}`)),
      };
    });
  }, CASES);
  for (const r of results) {
    expect(r.subtitle, `${r.card}: the subtitle's placement`).toEqual(['under the title']);
    expect(r.description, `${r.card}: the description's placement`).toEqual(['.x-card__description']);
  }
});

test('the text between the tags is the card content; no doc or example writes content= on a card', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.scan, null, { timeout: 20_000 });
  const body = await page.evaluate(async () => {
    const box = document.createElement('div');
    box.innerHTML = '<article id="cb" x-cardbutton title="Upgrade" primary="Go">Shared workspaces and SSO.</article>';
    document.body.appendChild(box);
    await (window as any).WB.scan(box, { eager: true });
    await (window as any).WB.settled({ timeout: 5000 });
    return document.getElementById('cb')!.textContent;
  });
  expect(body).toContain('Shared workspaces and SSO.');

  const sources = ['demos/playground.html', 'data/behavior-examples.json', 'scripts/seed-behavior-examples.mjs',
    'src/wb-models/pages/x-component-library.site.json',
    ...fs.readdirSync('src/wb-models').filter((f) => /^card[a-z]*\.schema\.json$/.test(f)).map((f) => `src/wb-models/${f}`),
    ...fs.readdirSync('docs/behaviors').filter((f) => /^card/.test(f)).map((f) => `docs/behaviors/${f}`)];
  const found: string[] = [];
  for (const f of sources) {
    const text = fs.readFileSync(path.join(process.cwd(), f), 'utf8').replace(/\\"/g, '"');
    for (const m of text.matchAll(/<[a-z]+\s[^>]*\bx-card[a-z]*\b[^>]*\scontent="/g)) found.push(`${f}: ${m[0].slice(0, 60)}`);
  }
  expect(found, 'write the content between the tags').toEqual([]);
});
