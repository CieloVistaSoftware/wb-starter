/**
 * #1695 -- <article variant="danger"> showed no accent stripe, where
 * success, warning, info and primary all did. The danger accent rule in
 * card.css listed `.x-card[variant="danger"]` and `article.x-card--danger`
 * but neither `article[variant="danger"]` nor the `:is([x-card], ...)`
 * [variant="danger"] form, so the attribute spelling -- the one a card's
 * variant is written in -- matched nothing on an article or an x-card host.
 *
 * Every variant, on both host forms, must get the 4px accent in its own
 * colour: the five must agree, so one missing from the list fails here.
 */
import { test, expect } from '../fixtures/offline';

const VARIANTS = ['success', 'danger', 'warning', 'info', 'primary'];
const TOKENS: Record<string, string> = {
  success: '--success-color', danger: '--danger-color', warning: '--warning-color', info: '--info-color', primary: '--primary',
};

test('every variant draws its 4px accent on an <article> and on an x-card host (#1695)', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20000 });

  const rows = await page.evaluate(async ({ variants, tokens }) => {
    const out: { card: string; width: string; color: string; want: string }[] = [];
    for (const markup of ['<article variant="V" title="T">Body</article>', '<div x-card variant="V" title="T">Body</div>']) {
      for (const v of variants) {
        const host = document.createElement('div');
        host.innerHTML = markup.replace('V', v);
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        const card = host.firstElementChild as HTMLElement;
        // The border eases in (card transitions): read it once the change has landed.
        await Promise.all(card.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
        const probe = document.createElement('span');
        probe.style.color = `var(${tokens[v]})`;
        card.appendChild(probe);
        const want = getComputedStyle(probe).color;
        probe.remove();
        const cs = getComputedStyle(card);
        out.push({ card: `${card.tagName.toLowerCase()}${card.hasAttribute('x-card') ? '[x-card]' : ''}[variant=${v}]`, width: cs.borderLeftWidth, color: cs.borderLeftColor, want });
        host.remove();
      }
    }
    return out;
  }, { variants: VARIANTS, tokens: TOKENS });

  expect(rows.length).toBe(10);
  const wrong = rows.filter((r) => r.width !== '4px' || r.color !== r.want)
    .map((r) => `${r.card}: ${r.width} ${r.color} (want 4px ${r.want})`);
  expect(wrong, 'variant cards without their accent stripe').toEqual([]);
});
