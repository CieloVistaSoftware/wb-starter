import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '../fixtures/offline';

/**
 * Every x-cardexpandable example on the Behaviors page reveals something when
 * expanded, and a card with nothing to reveal offers no toggle (#1598).
 *
 * John: "None of these show anything in the expanded area." All five examples
 * (default, elevated, bordered, expanded, four lines visible) were one short
 * paragraph under a line clamp (lines="2" / lines="4"). At the preview's width
 * the paragraph wrapped to about two lines, so the clamp clipped nothing:
 * content height was 69px collapsed AND expanded, and Show More only flipped
 * its label.
 *
 * x-cardexpandable-toggle-visibly-changes.spec.ts did not catch it. It renders
 * one hand-built card forced to size="sm" with a long paragraph, on the
 * max-height path, and never the catalogue examples or the lines clamp they
 * all use. This spec reads the examples from data/behavior-examples.json, the
 * file the Behaviors page renders, and every x-cardexpandable demo on
 * demos/site/cards.html, so a new or edited example is covered with no change
 * here.
 *
 * Oracle, for every example at two preview widths:
 *   - collapsed, the content hides something: scrollHeight > clientHeight
 *   - the toggle is shown, and clicking it makes the content area taller
 * and for a card whose content fits: the card is marked
 * x-card--nothing-to-expand and its toggle is not visible.
 */

const catalogue = JSON.parse(readFileSync(join(process.cwd(), 'data', 'behavior-examples.json'), 'utf8'));
const entry = catalogue.examples['x-cardexpandable'];
// The cards demo page had seven more of the same: content="Content" or one
// short sentence, so none of them could reveal anything either (#1598).
const cardsPage = readFileSync(join(process.cwd(), 'demos', 'site', 'cards.html'), 'utf8');
const CARDS_PAGE_DEMOS = [...cardsPage.matchAll(/<(article|div) x-cardexpandable[\s\S]*?<\/\1>/g)].map((m, i) => ({
  label: `cards.html demo ${i + 1}`,
  source: m[0],
}));
const EXAMPLES: { label: string; source: string }[] = [
  { label: 'base example', source: entry.source },
  ...(entry.examples || []).map((e: { label: string; source: string }) => ({ label: e.label, source: e.source })),
  ...CARDS_PAGE_DEMOS,
];
const WIDTHS = [1100, 1600];

type Measure = { label: string; width: number; scroll: number; client: number; toggleShown: boolean; grew: boolean; collapsed: number; expanded: number };

test.describe('x-cardexpandable examples reveal content when expanded (#1598)', () => {
  test('every catalogue example hides content collapsed and grows on Show More', async ({ page }) => {
    expect(EXAMPLES.length, 'the catalogue has x-cardexpandable examples').toBeGreaterThan(0);
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    const rows: Measure[] = await page.evaluate(async ({ examples, widths }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const out: any[] = [];
      for (const width of widths) {
        for (const ex of examples) {
          const host = document.createElement('div');
          host.className = 'x-card-expandable-sweep';
          host.setAttribute('data-width', String(width));
          host.innerHTML = ex.source;
          document.body.appendChild(host);
          host.style.width = width + 'px';
          await (window as any).WB.scan(host, { eager: true });
          await frame();
          const card = host.firstElementChild as HTMLElement;
          const content = card.querySelector('.x-card__expandable-content') as HTMLElement;
          const btn = card.querySelector('.x-card__expand-btn') as HTMLElement;
          // The "expanded" variant starts open: collapse it first so every
          // example is measured from the collapsed state.
          // Each toggle waits for the card's own transition, not 400ms (#1516).
          if (btn && btn.getAttribute('aria-expanded') === 'true') { btn.click(); await frame(); await Promise.all(card.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))); }
          const scroll = content.scrollHeight, client = content.clientHeight;
          const toggleShown = !!btn && btn.offsetParent !== null;
          const collapsed = content.getBoundingClientRect().height;
          if (btn) { btn.click(); await frame(); await Promise.all(card.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))); }
          const expanded = content.getBoundingClientRect().height;
          out.push({ label: ex.label, width, scroll, client, toggleShown, grew: expanded > collapsed + 1, collapsed, expanded });
          host.remove();
        }
      }
      return out;
    }, { examples: EXAMPLES, widths: WIDTHS });

    for (const r of rows) {
      const where = `${r.label} at ${r.width}px`;
      expect(r.scroll, `${where}: collapsed content hides something (scroll ${r.scroll} > client ${r.client})`).toBeGreaterThan(r.client + 1);
      expect(r.toggleShown, `${where}: Show More is shown`).toBe(true);
      expect(r.grew, `${where}: Show More makes the content taller (${r.collapsed}px -> ${r.expanded}px)`).toBe(true);
    }
  });

  test('a card whose content fits offers no toggle', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    const result = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML = '<article x-cardexpandable title="Short" content="One line." lines="3"></article>';
      document.body.appendChild(host);
      host.style.width = '800px';
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const card = host.firstElementChild as HTMLElement;
      const btn = card.querySelector('.x-card__expand-btn') as HTMLElement | null;
      const out = { marked: card.classList.contains('x-card--nothing-to-expand'), toggleShown: !!btn && btn.offsetParent !== null };
      host.remove();
      return out;
    });

    expect(result.marked, 'the card is marked x-card--nothing-to-expand').toBe(true);
    expect(result.toggleShown, 'no Show More toggle is shown').toBe(false);
  });
});
