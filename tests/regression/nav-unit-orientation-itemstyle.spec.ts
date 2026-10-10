/**
 * THE NAV UNIT: orientation AND itemstyle, DECLARED AND RENDERED (#830, #828)
 * ==========================================================================
 * John: "Something as fundamental as a navigator should have our own
 * enhancements." #830 asked for one nav unit "with items/active/orientation
 * declared", and absorbed #828's pill item style as a schema property rather
 * than a config key.
 *
 * The nav unit is two behaviors: navbar (every <nav>, and <div x-nav>
 * anywhere) and sidebar (<nav x-sidebar>, the site's left nav). Before this,
 * neither had `orientation`, navbar had no `itemstyle`, and an x-sidebar with
 * authored <a> children and no items attribute discarded them.
 *
 * Now:
 *   navbar   orientation="horizontal|vertical"  -> .x-navbar--vertical
 *            itemstyle="block|pill"             -> .x-navbar--pill
 *   sidebar  orientation="vertical|horizontal"  -> .x-sidebar--horizontal
 *            itemstyle="block|pill"             -> .x-sidebar--pill (#828)
 *            no items -> its authored <a> children are the items
 * and both schemas declare every one of them with a type and a default.
 *
 * See it by hand: on any page, write
 *   <nav orientation="vertical" itemstyle="pill"><a href="#a" aria-current="page">A</a><a href="#b">B</a></nav>
 * Before: A and B on one line, plain links. Now: stacked, and A is a rounded
 * accent pill.
 */
import fs from 'fs';
import { execFileSync } from 'child_process';
import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';
import { wbIdle } from '../base';

/** Each link's box and look, in document order. */
const links = (page: Page, hostId: string, selector = 'a') => page.locator(`#${hostId}`).evaluate((host, sel) => {
  const probe = document.createElement('span');
  probe.style.color = 'var(--primary)';
  document.body.append(probe);
  const primary = getComputedStyle(probe).color;
  probe.remove();
  return [...host.querySelectorAll(sel)].map((a) => {
    const box = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    return {
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      left: Math.round(box.left),
      radius: parseFloat(cs.borderTopLeftRadius),
      primaryFill: cs.backgroundColor === primary,
    };
  });
}, selector);

const stacked = (l: { top: number; bottom: number }[]) => l.length > 1 && l.every((x, i) => i === 0 || x.top >= l[i - 1].bottom);
/** Side by side: each one starts right of the last and overlaps it vertically. */
const inARow = (l: { top: number; bottom: number; left: number }[]) => l.length > 1
  && l.every((x, i) => i === 0 || (x.left > l[i - 1].left && x.top < l[i - 1].bottom));

test.describe('navbar (every <nav>, and x-nav anywhere)', () => {
  test('orientation="vertical" stacks the links; the default and "horizontal" keep them in a row', async ({ page }) => {
    await injectAndScan(page, `
      <nav id="plain"><a href="#a">Alpha</a> <a href="#b">Beta</a> <a href="#c">Gamma</a></nav>
      <nav id="horiz" orientation="horizontal"><a href="#a">Alpha</a> <a href="#b">Beta</a></nav>
      <nav id="vert" orientation="vertical"><a href="#a">Alpha</a> <a href="#b">Beta</a> <a href="#c">Gamma</a></nav>
      <div id="anywhere" x-nav orientation="vertical"><a href="#a">Alpha</a> <a href="#b">Beta</a></div>
      <div id="header" x-navbar brand="Site" items="Home:#home,About:#about,Docs:#docs" orientation="vertical"></div>
      <div id="headerRow" x-navbar brand="Site" items="Home:#home,About:#about,Docs:#docs"></div>`);
    await expect(page.locator('#vert')).toHaveClass(/x-navbar--vertical/, { timeout: 15000 });
    await expect(page.locator('#anywhere')).toHaveClass(/x-navbar--vertical/);
    await expect(page.locator('#header')).toHaveClass(/x-navbar--vertical/);
    await expect(page.locator('#plain')).not.toHaveClass(/x-navbar--vertical/);
    await expect(page.locator('#horiz')).not.toHaveClass(/x-navbar--vertical/);

    expect(inARow(await links(page, 'plain')), 'a plain <nav> keeps its links on one line').toBe(true);
    expect(inARow(await links(page, 'horiz'))).toBe(true);
    expect(stacked(await links(page, 'vert')), '<nav orientation="vertical"> stacks its links').toBe(true);
    expect(stacked(await links(page, 'anywhere')), '<div x-nav orientation="vertical"> stacks its links').toBe(true);

    expect(inARow(await links(page, 'headerRow', '.x-navbar__item')), 'the header menu is a row by default').toBe(true);
    const col = await links(page, 'header', '.x-navbar__item');
    expect(col.length).toBe(3);
    expect(stacked(col), 'a vertical header stacks its menu').toBe(true);
    expect(await page.locator('#header').evaluate((el) => getComputedStyle(el).flexDirection)).toBe('column');
  });

  test('itemstyle="pill" rounds every link and fills the current one with the accent; block (the default) does not', async ({ page }) => {
    await injectAndScan(page, `
      <nav id="block"><a href="#a" aria-current="page">Alpha</a> <a href="#b">Beta</a></nav>
      <nav id="pill" itemstyle="pill"><a href="#a" aria-current="page">Alpha</a> <a href="#b">Beta</a></nav>
      <div id="headerPill" x-navbar brand="Site" items="Home:#home,About:#about" itemstyle="pill"></div>`);
    await expect(page.locator('#pill')).toHaveClass(/x-navbar--pill/, { timeout: 15000 });
    await expect(page.locator('#headerPill')).toHaveClass(/x-navbar--pill/);
    await expect(page.locator('#block')).not.toHaveClass(/x-navbar--pill/);

    const block = await links(page, 'block');
    expect(block.every((l) => l.radius === 0), 'block: plain links, no rounding').toBe(true);
    expect(block[0].primaryFill).toBe(false);

    const pill = await links(page, 'pill');
    expect(pill.every((l) => l.radius > 100), 'pill: every link fully rounded').toBe(true);
    expect(pill[0].primaryFill, 'the aria-current link is an accent pill').toBe(true);
    expect(pill[1].primaryFill).toBe(false);

    const headerRadius = await page.locator('#headerPill .x-navbar__item').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius)));
    expect(headerRadius.length).toBe(2);
    expect(headerRadius.every((r) => r > 100), 'a header navbar\'s menu items are pills too').toBe(true);
  });

  test('orientation and itemstyle follow the attribute after load', async ({ page }) => {
    await injectAndScan(page, '<nav id="live"><a href="#a">Alpha</a> <a href="#b">Beta</a></nav>');
    const nav = page.locator('#live');
    await expect(nav).toHaveClass(/x-navbar/, { timeout: 15000 });
    await nav.evaluate((el) => { el.setAttribute('orientation', 'vertical'); el.setAttribute('itemstyle', 'pill'); });
    await expect(nav).toHaveClass(/x-navbar--vertical/);
    await expect(nav).toHaveClass(/x-navbar--pill/);
    expect(stacked(await links(page, 'live'))).toBe(true);
    await nav.evaluate((el) => { el.setAttribute('orientation', 'horizontal'); el.removeAttribute('itemstyle'); });
    await expect(nav).not.toHaveClass(/x-navbar--vertical/);
    await expect(nav).not.toHaveClass(/x-navbar--pill/);
    expect(inARow(await links(page, 'live'))).toBe(true);
  });
});

test.describe('sidebar', () => {
  test('orientation="horizontal" puts the items in a row; vertical (the default) stacks them; it follows the attribute', async ({ page }) => {
    await injectAndScan(page, `
      <nav id="col" x-sidebar items="Home:#home,About:#about,Docs:#docs" active="Home"></nav>
      <nav id="vcol" x-sidebar items="Home:#home,About:#about,Docs:#docs" orientation="vertical"></nav>
      <nav id="row" x-sidebar items="Home:#home,About:#about,Docs:#docs" active="Home" orientation="horizontal"></nav>`);
    await expect(page.locator('#row')).toHaveClass(/x-sidebar--horizontal/, { timeout: 15000 });
    await expect(page.locator('#col')).not.toHaveClass(/x-sidebar--horizontal/);
    await expect(page.locator('#vcol')).not.toHaveClass(/x-sidebar--horizontal/);
    expect(stacked(await links(page, 'col'))).toBe(true);
    expect(stacked(await links(page, 'vcol'))).toBe(true);
    expect(inARow(await links(page, 'row')), 'horizontal: one row').toBe(true);

    await page.locator('#col').evaluate((el) => el.setAttribute('orientation', 'horizontal'));
    await expect(page.locator('#col')).toHaveClass(/x-sidebar--horizontal/);
    expect(inARow(await links(page, 'col'))).toBe(true);
  });

  test('with no items attribute, the authored <a> children are its items, and active still works', async ({ page }) => {
    await injectAndScan(page, '<nav id="authored" x-sidebar active="About"><a href="/home">Home</a><a href="/about" target="_blank">About</a></nav>');
    const items = page.locator('#authored .x-sidebar__item');
    await expect(items).toHaveCount(2, { timeout: 15000 });
    await expect(items.nth(0)).toHaveAttribute('href', '/home');
    await expect(items.nth(0).locator('.x-sidebar__label')).toHaveText('Home');
    await expect(items.nth(1)).toHaveAttribute('target', '_blank');
    await expect(items.nth(1)).toHaveClass(/x-sidebar__item--active/);
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('declared', () => {
  test('navbar and sidebar schemas declare orientation and itemstyle with a type, an enum and a default', () => {
    const want = {
      navbar: { orientation: ['horizontal', ['horizontal', 'vertical']], itemstyle: ['block', ['block', 'pill']] },
      sidebar: { orientation: ['vertical', ['vertical', 'horizontal']], itemstyle: ['block', ['block', 'pill']] },
    } as const;
    for (const [behavior, props] of Object.entries(want)) {
      const schema = JSON.parse(fs.readFileSync(`src/wb-models/${behavior}.schema.json`, 'utf8'));
      for (const [name, [def, values]] of Object.entries(props)) {
        const prop = schema.properties[name];
        expect(prop, `${behavior}.schema.json declares ${name}`).toBeTruthy();
        expect(prop.type).toBe('string');
        expect(prop.default).toBe(def);
        expect([...prop.enum].sort()).toEqual([...values].sort());
      }
      for (const [name, prop] of Object.entries<any>(schema.properties)) {
        expect(prop.type, `${behavior}.${name} has a type`).toBeTruthy();
        expect('default' in prop, `${behavior}.${name} has a default`).toBe(true);
      }
    }
  });

  test('the registry audit does not list sidebar or navbar as reachable without a schema', () => {
    const out = execFileSync('node', ['scripts/audit-behavior-registry.mjs'], { encoding: 'utf8' });
    const section = out.split('REACHABLE, NO SCHEMA')[1]?.split('\n\n')[0] ?? '';
    const names = (section.split('\n').slice(2).join(' ').match(/[\w-]+/g) ?? []);
    expect(names.length, 'the audit printed its REACHABLE, NO SCHEMA list').toBeGreaterThan(0);
    expect(names).not.toContain('sidebar');
    expect(names).not.toContain('navbar');
  });
});

test('the site nav still renders as before: a vertical block x-sidebar with its items stacked', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?page=home', { waitUntil: 'domcontentloaded' });
  await wbIdle(page);
  const nav = page.locator('#siteNav');
  await expect(page.locator('#siteNav .x-sidebar__item--active')).toHaveCount(1, { timeout: 30000 });
  await expect(nav).toHaveClass(/\bx-sidebar\b/);
  await expect(nav).not.toHaveClass(/x-sidebar--horizontal|x-navbar/);
  expect(stacked(await links(page, 'siteNav')), 'the site nav items are a column').toBe(true);
});
