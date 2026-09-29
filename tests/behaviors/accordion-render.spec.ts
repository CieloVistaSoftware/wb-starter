/**
 * x-accordion: markup is three SIBLING accordions each with its own answer —
 * the body no longer duplicates the title (#145). (The original bug was malformed
 * nested markup that made each accordion's "content" echo the title.)
 */
import { test, expect } from '../fixtures/offline';
import { openBehaviorsPanel, renderVariant, example } from '../utils/behaviors-panel';

// The Behaviors page stopped hosting static `[x-accordion]` sections in #664;
// it builds the x-accordion example on demand in #behaviors-live-example (from
// data/behavior-examples.json). Waiting for a page-wide [x-accordion] timed
// out, and the three answers it looked for were the retired section's copy.
// The claim is unchanged: sibling panels, each with its own answer, and no
// body that merely repeats its title.
test('three sibling accordions, each with its distinct answer (not the title)', async ({ page }) => {
  await openBehaviorsPanel(page, 'x-accordion');
  // Its one option row (open=true). There was a bare "no option" row only
  // while the stale schema index hid x-accordion's options (#1146); the claim
  // below is about the panels, which are the same either way.
  await renderVariant(page, 'x-accordion', 'true');

  const accordion = example(page);
  await expect(accordion).toHaveAttribute('x-accordion', '');
  await expect(accordion).toHaveAttribute('x-ready', '');

  // markup fix: SIBLING panels (the malformed version nested them)
  const panels = accordion.locator(':scope > details');
  expect(await panels.count()).toBeGreaterThanOrEqual(3);
  expect(await accordion.locator('details details').count(), 'panels must not nest').toBe(0);

  // each distinct answer renders (proves bodies hold answers, not duplicated titles)
  await expect(accordion).toContainText('calls the matching behavior function');
  await expect(accordion).toContainText('Light DOM only');
  await expect(accordion).toContainText('The browser loads the modules directly');

  // and no panel's own content is just its title repeated
  const rows = await panels.evaluateAll((els) => els.map((e) => ({
    title: (e.querySelector('summary')?.textContent || '').trim(),
    body: (e.querySelector('p')?.textContent || '').trim(),
  })));
  for (const r of rows) {
    expect(r.body, `panel "${r.title}" has no answer`).not.toBe('');
    expect(r.body, 'no accordion body equals its title').not.toBe(r.title);
  }
  expect(new Set(rows.map((r) => r.body)).size, 'each panel has its own answer').toBe(rows.length);
});
