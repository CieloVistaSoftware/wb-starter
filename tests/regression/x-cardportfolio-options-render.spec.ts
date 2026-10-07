import { test, expect } from '../fixtures/offline';

/**
 * John, on the behaviors page, of every x-cardportfolio option row: "none of
 * these are right", and of the default row: "the image hides the rest of the
 * card". Measured live before the fix:
 *
 * - default: the cover <figure> (position:relative) painted OVER the header,
 *   which card.js pulled up 60px underneath it. The avatar was invisible and
 *   the name sat half under the image. The empty figure was also auto-
 *   injected with the figure behavior and "taught" caption="this is the
 *   caption", printed across the banner.
 * - the avatar wrap was a <figure>, so card.css's `article figure > span`
 *   overlay-badge rule made the initials and status dot absolute pills; the
 *   wrap collapsed to 0x0.
 * - size=*: the size rules were written `.x-portfolio.x-card--sm,
 *   .x-portfolio[variant="sm"] .x-portfolio__avatar {width:4.5rem...}`, so
 *   the comma sized the CARD: size="sm" rendered 220x72 with the title one
 *   word per line, size="full" 176px wide. The avatar never scaled.
 * - horizontal: a fixed 10rem identity column wrapped the title one word
 *   per line; the header was lifted out of the card by the cover offset.
 * - availability: a 24px dot with a hover title was the only signal.
 *
 * Every row is rendered through the page's own option rows, exactly as a
 * reader sees it, and the distinguishing fact for each option is measured.
 */

type Box = { x: number; y: number; w: number; h: number; right: number; bottom: number };
type Shot = {
  found: boolean;
  card: Box;
  cover: Box | null;
  header: Box;
  avatar: Box | null;
  dot: Box | null;
  dotColor: string | null;
  status: Box | null;
  statusText: string;
  statusColor: string | null;
  texts: { cls: string; box: Box; clipped: boolean; lines: number }[];
  caption: string;
  inlineWidth: string;
};

test.describe('x-cardportfolio option rows on the behaviors page', () => {
  test('every option renders as itself: banner above the text, variants/sizes/availability distinct', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('/?page=behaviors');
    await page.waitForSelector('.behaviors-search-results__row');

    const rows = page.locator('.behaviors-search-results__row[data-browse-token="x-cardportfolio"]');
    await page.locator('#behaviors-search-results details', { has: rows.first() })
      .locator(':scope > summary').click();

    const shots: Record<string, Shot> = {};
    const count = await rows.count();
    expect(count, 'x-cardportfolio has option rows').toBeGreaterThan(8);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const key = await row.evaluate((r: HTMLElement) =>
        `${r.dataset.prop || 'variant'}=${r.dataset.variant || 'default'}`);
      await row.click();
      // The example has rendered once the live panel is no longer busy (#1516: not 1500ms).
      await expect(page.locator('#behaviors-live')).not.toHaveAttribute('aria-busy', /.*/, { timeout: 15000 });

      shots[key] = await page.locator('#behaviors-live-example').evaluate((root): Shot => {
        const box = (n: Element | null): Box | null => {
          if (!n) return null;
          const b = n.getBoundingClientRect();
          return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
        };
        const el = root.querySelector('[x-cardportfolio]') as HTMLElement | null;
        if (!el) return { found: false } as Shot;
        const q = (s: string) => el.querySelector(s);
        const dot = q('.x-portfolio__availability');
        const status = q('.x-portfolio__status');
        const texts = ['.x-portfolio__name', '.x-portfolio__title', '.x-portfolio__location', '.x-portfolio__status']
          .map((s) => q(s) as HTMLElement | null)
          .filter((n): n is HTMLElement => !!n)
          .map((n) => {
            const lh = parseFloat(getComputedStyle(n).lineHeight) || parseFloat(getComputedStyle(n).fontSize) * 1.2;
            return {
              cls: n.className,
              box: box(n)!,
              clipped: n.scrollWidth > n.clientWidth + 1,
              lines: Math.round(n.getBoundingClientRect().height / lh),
            };
          });
        return {
          found: true,
          card: box(el)!,
          cover: box(q('.x-portfolio__cover')),
          header: box(q('.x-portfolio__header'))!,
          avatar: box(q('.x-portfolio__avatar')),
          dot: box(dot),
          dotColor: dot ? getComputedStyle(dot).backgroundColor : null,
          status: box(status),
          statusText: status ? (status.textContent || '').trim() : '',
          statusColor: status ? getComputedStyle(status, '::before').backgroundColor : null,
          texts,
          caption: Array.from(el.querySelectorAll('figcaption')).map((c) => c.textContent).join('|'),
          inlineWidth: el.style.maxWidth,
        };
      });
    }

    const keys = Object.keys(shots);
    for (const k of ['variant=default', 'variant=compact', 'variant=horizontal', 'variant=full',
      'availability=available', 'availability=busy', 'availability=not-available',
      'availability=open-to-opportunities', 'size=sm', 'size=md', 'size=lg']) {
      expect(keys, `option row ${k} exists`).toContain(k);
    }

    const overlaps = (a: Box, b: Box) =>
      a.x < b.right - 1 && b.x < a.right - 1 && a.y < b.bottom - 1 && b.y < a.bottom - 1;

    // ── Every row: rendered, nothing hidden, nothing crushed ──
    for (const [key, s] of Object.entries(shots)) {
      expect(s.found, `${key}: card rendered`).toBe(true);
      expect(s.caption, `${key}: no taught "this is the caption" on the cover`).toBe('');
      expect(s.inlineWidth, `${key}: width is card.css's, not an inline max-width`).toBe('');
      expect(s.card.w, `${key}: card not crushed`).toBeGreaterThanOrEqual(200);

      // The avatar is visible: a real box, inside the card, not under the cover.
      expect(s.avatar, `${key}: avatar present`).not.toBeNull();
      expect(s.avatar!.w, `${key}: avatar has size`).toBeGreaterThan(30);
      expect(s.avatar!.y, `${key}: avatar inside card`).toBeGreaterThanOrEqual(s.card.y - 1);
      expect(s.avatar!.bottom, `${key}: avatar inside card`).toBeLessThanOrEqual(s.card.bottom + 1);

      // The cover is a banner, never over the text.
      expect(s.cover, `${key}: cover present`).not.toBeNull();
      expect(s.cover!.h, `${key}: cover visible`).toBeGreaterThan(40);
      expect(overlaps(s.cover!, s.avatar!), `${key}: cover does not overlap the avatar`).toBe(false);
      for (const t of s.texts) {
        expect(overlaps(s.cover!, t.box), `${key}: cover does not overlap ${t.cls}`).toBe(false);
        expect(t.clipped, `${key}: ${t.cls} not clipped/ellipsised`).toBe(false);
        expect(t.lines, `${key}: ${t.cls} not wrapped word-per-line`).toBeLessThanOrEqual(3);
        expect(t.box.bottom, `${key}: ${t.cls} inside card`).toBeLessThanOrEqual(s.card.bottom + 1);
      }
      if (!key.startsWith('variant=horizontal')) {
        const name = s.texts.find((t) => t.cls.includes('__name'))!;
        expect(s.cover!.bottom, `${key}: cover ends above the name`).toBeLessThanOrEqual(name.box.y);
        expect(s.cover!.bottom, `${key}: cover ends above the header`).toBeLessThanOrEqual(s.header.y + 1);
      }

      // The availability indicator: a dot AND a label, same colour.
      expect(s.dot, `${key}: status dot`).not.toBeNull();
      expect(s.dot!.w, `${key}: status dot visible`).toBeGreaterThanOrEqual(10);
      expect(s.statusText.length, `${key}: status label text`).toBeGreaterThan(3);
      expect(s.statusColor, `${key}: label colour matches dot`).toBe(s.dotColor);
    }

    const d = shots['variant=default'];
    const c = shots['variant=compact'];
    const h = shots['variant=horizontal'];
    const f = shots['variant=full'];

    // compact: smaller and tighter.
    expect(c.card.w).toBeLessThan(d.card.w);
    expect(c.card.h).toBeLessThan(d.card.h);
    expect(c.avatar!.w).toBeLessThan(d.avatar!.w);
    expect(c.cover!.h).toBeLessThan(d.cover!.h);

    // horizontal: the image BESIDE the text, sharing the same band.
    const hName = h.texts.find((t) => t.cls.includes('__name'))!.box;
    expect(h.cover!.right).toBeLessThanOrEqual(hName.x);
    expect(h.cover!.y).toBeLessThan(hName.bottom);
    expect(h.cover!.bottom).toBeGreaterThan(hName.y);
    expect(h.card.w).toBeGreaterThan(d.card.w);
    expect(h.card.h).toBeLessThan(d.card.h);
    // The banner fills its column: no blank band under it.
    expect(h.cover!.h).toBeGreaterThanOrEqual(h.header.h - 2);

    // full: wider and fuller.
    expect(f.card.w).toBeGreaterThan(d.card.w * 1.5);
    expect(f.avatar!.w).toBeGreaterThan(d.avatar!.w);
    expect(f.cover!.h).toBeGreaterThan(d.cover!.h);

    // availability: four distinct colours, four distinct labels.
    const avail = ['available', 'busy', 'not-available', 'open-to-opportunities'].map((v) => shots[`availability=${v}`]);
    expect(new Set(avail.map((a) => a.dotColor)).size).toBe(4);
    expect(new Set(avail.map((a) => a.statusText)).size).toBe(4);
    expect(shots['availability=available'].statusText).toMatch(/available/i);
    expect(shots['availability=busy'].statusText).toMatch(/busy/i);
    expect(shots['availability=not-available'].statusText).toMatch(/not available/i);
    expect(shots['availability=open-to-opportunities'].statusText).toMatch(/open/i);

    // sizes: the card, the banner and the avatar all scale.
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'].filter((z) => shots[`size=${z}`]).map((z) => shots[`size=${z}`]);
    expect(sizes.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i].card.w, 'size widths increase').toBeGreaterThan(sizes[i - 1].card.w);
      expect(sizes[i].avatar!.w, 'size avatars increase').toBeGreaterThan(sizes[i - 1].avatar!.w);
      expect(sizes[i].cover!.h, 'size banners increase').toBeGreaterThan(sizes[i - 1].cover!.h);
    }
  });
});
