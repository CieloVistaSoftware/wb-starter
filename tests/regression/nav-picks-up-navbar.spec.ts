import { test, expect } from '../fixtures/offline';

/**
 * A <nav> picks up navbar, and a plain one keeps its layout (#958).
 *
 * John, 2026-09-10: "in html5 there is a nav element, when we created the
 * navbar our intent was to give the nav links a look and feel of our site".
 * nativeMap now maps nav -> navbar. The one-line change was tried before and
 * reverted: navbar() wrapped a plain nav's links into the header's flex menu
 * and moved a "← Back to Index" link from 0px to 854px on 9 of 12 plain navs.
 * Now a plain <nav> gets the link look only; a <nav> that asks for a header
 * (brand, items, logo, sticky, variant) gets the header; and a <nav> that
 * names a behavior of its own (x-breadcrumb, x-scrollalong) keeps just that.
 */
const PLAIN_NAV_PAGES = [
  'feedback', 'shop-now', 'forms', 'layout', 'learn-more',
  'interactive', 'content', 'effects', 'cards', 'overlays',
];

async function scanned(page: import('@playwright/test').Page, html: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  return page.evaluate(async (markup) => {
    const host = document.createElement('div');
    host.style.width = '967px';
    host.innerHTML = markup;
    document.body.appendChild(host);
    const link = host.querySelector('a');
    const before = link ? link.getBoundingClientRect().left - host.getBoundingClientRect().left : null;
    await (window as any).WB.scan(host, { eager: true });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const nav = host.querySelector('nav') as HTMLElement;
    const after = link ? link.getBoundingClientRect().left - host.getBoundingClientRect().left : null;
    const probe = document.createElement('span');
    probe.style.color = 'var(--primary)';
    host.appendChild(probe);
    return {
      cls: nav.className,
      before, after,
      linkColor: link ? getComputedStyle(link).color : '',
      primary: getComputedStyle(probe).color,
      menu: !!nav.querySelector('.x-navbar__menu'),
      brand: !!nav.querySelector('.x-navbar__brand'),
      position: getComputedStyle(nav).position,
    };
  }, html);
}

test('a plain <nav> picks up navbar: the site link look, and its link does not move', async ({ page }) => {
  const r = await scanned(page, '<nav style="margin-bottom: 1rem;"><a href="index.html">← Back to Index</a></nav>');
  expect(r.cls).toContain('x-navbar');
  expect(r.cls).toContain('x-navbar--plain');
  expect(r.menu, 'its links are not wrapped into the header menu').toBe(false);
  expect(r.after, 'the link stays where it was').toBe(r.before);
  expect(r.linkColor, 'links take the theme colour').toBe(r.primary);
});

test('a <nav> that asks for a header gets the header, like x-navbar', async ({ page }) => {
  const r = await scanned(page, '<nav brand="MySite" items="Home,Docs"></nav>');
  expect(r.cls).toContain('x-navbar--site');
  expect(r.brand, 'brand built').toBe(true);
  expect(r.menu, 'menu built').toBe(true);
  expect(r.position, 'the header rules apply').toBe('sticky');
});

test('a <nav> that names its own behavior keeps only that one', async ({ page }) => {
  const r = await scanned(page, '<nav x-breadcrumb items="Home,Docs,Behaviors"></nav>');
  expect(r.cls).not.toContain('x-navbar');
});

for (const name of PLAIN_NAV_PAGES) {
  test(`demos/site/${name}.html: every plain <nav> link is where it would be without navbar`, async ({ page }) => {
    await page.goto(`/demos/site/${name}.html`);
    await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
    await page.waitForFunction(() => document.querySelector('nav.x-navbar--plain'), null, { timeout: 15_000 });
    const moved = await page.evaluate(async () => {
      const navs = Array.from(document.querySelectorAll('nav.x-navbar--plain')) as HTMLElement[];
      const read = () => navs.flatMap((n) => Array.from(n.querySelectorAll('a')).map((a) => {
        const r = a.getBoundingClientRect();
        return `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)}`;
      }));
      const withNavbar = read();
      navs.forEach((n) => n.classList.remove('x-navbar', 'x-navbar--plain'));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const without = read();
      return withNavbar.filter((v, i) => v !== without[i]).length;
    });
    expect(moved, 'links moved by navbar').toBe(0);
  });
}

test('the site sidebar keeps its own link styling', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => document.querySelector('#siteNav a'), null, { timeout: 15_000 });
  const r = await page.evaluate(async () => {
    const nav = document.getElementById('siteNav') as HTMLElement;
    const a = nav.querySelector('a') as HTMLElement;
    const withIt = getComputedStyle(a).color;
    nav.classList.remove('x-navbar', 'x-navbar--plain');
    await new Promise((r) => requestAnimationFrame(r));
    return { withIt, without: getComputedStyle(a).color };
  });
  expect(r.withIt).toBe(r.without);
});
