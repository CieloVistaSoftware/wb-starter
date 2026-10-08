import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #344: schemas declared events that no behavior fired. audio, cardvideo,
 * dialog, drawer, tooltip and dropdown now fire theirs; this drives each one
 * the way a page would and reads the events that reached the host.
 *
 * source-schema-compliance.spec.ts checks statically that each declared
 * event is named in the module; this checks that it actually fires.
 */

const WATCHED = [
  ...['play', 'pause', 'ended', 'volumechange', 'eqchange'].map((n) => `wb:audio:${n}`),
  ...['play', 'pause', 'ended', 'timeupdate'].map((n) => `wb:video:${n}`),
  ...['open', 'close', 'cancel'].map((n) => `wb:dialog:${n}`),
  'wb:drawer:open', 'wb:drawer:close', 'wb:tooltip:show', 'wb:tooltip:hide',
  'wb:dropdown:open', 'wb:dropdown:close', 'wb:cardlink:click', 'wb:chip:remove',
  'wb:table:sort', 'wb:table:filter', 'wb:table:page', 'wb:select:change',
  'wb:ripple:show', 'wb:drawerLayout:toggle', 'wb:confetti:start', 'wb:confetti:end',
];

/** Every watched event that reaches `id`, in order, with its detail. */
async function record(page: Page, id: string) {
  await page.evaluate(({ elId, names }) => {
    const el = document.getElementById(elId)!;
    (window as any).__events = [];
    (window as any).__details = [];
    for (const name of names) {
      el.addEventListener(name, (e) => {
        (window as any).__events.push(name);
        (window as any).__details.push((e as CustomEvent).detail ?? null);
      });
    }
  }, { elId: id, names: WATCHED });
}

const details = (page: Page) => page.evaluate(() => (window as any).__details as unknown[]);

const events = (page: Page) => page.evaluate(() => (window as any).__events as string[]);

test.describe('schema-declared events fire (#344)', () => {
  test('audio relays play, pause, ended and volumechange from its media element', async ({ page }) => {
    // wb-lazy upgrades media as it nears the viewport.
    await injectAndScan(page, '<audio id="au" controls src="https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3"></audio>', { scrollIntoView: true });
    await expect(page.locator('#au')).toHaveClass(/x-audio/, { timeout: 15000 });
    await record(page, 'au');
    await page.evaluate(() => {
      const el = document.getElementById('au') as HTMLAudioElement;
      for (const type of ['play', 'pause', 'ended']) el.dispatchEvent(new Event(type));
      el.volume = 0.3;
    });
    await expect.poll(() => events(page)).toEqual(['wb:audio:play', 'wb:audio:pause', 'wb:audio:ended', 'wb:audio:volumechange']);
  });

  test('cardvideo relays play, pause, ended and timeupdate onto the card', async ({ page }) => {
    await injectAndScan(page, '<article id="cv" x-cardvideo src="https://www.w3schools.com/html/mov_bbb.mp4" title="Clip"></article>');
    await expect(page.locator('#cv video')).toHaveCount(1, { timeout: 15000 });
    await record(page, 'cv');
    await page.evaluate(() => {
      const video = document.querySelector('#cv video')!;
      for (const type of ['play', 'pause', 'ended', 'timeupdate']) video.dispatchEvent(new Event(type));
    });
    await expect.poll(() => events(page)).toEqual(['wb:video:play', 'wb:video:pause', 'wb:video:ended', 'wb:video:timeupdate']);
  });

  test('an authored dialog fires open, then cancel and close on Escape', async ({ page }) => {
    await injectAndScan(page, '<dialog id="dl"><h2>Delete file?</h2><p>This cannot be undone.</p></dialog>');
    await expect(page.locator('#dl')).toHaveClass(/x-dialog/, { timeout: 15000 });
    await record(page, 'dl');
    await page.evaluate(() => (document.getElementById('dl') as HTMLDialogElement).showModal());
    await expect.poll(() => events(page)).toEqual(['wb:dialog:open']);
    await page.keyboard.press('Escape');
    await expect.poll(() => events(page)).toEqual(['wb:dialog:open', 'wb:dialog:cancel', 'wb:dialog:close']);
  });

  test('drawer fires open when its trigger opens it and close when it closes', async ({ page }) => {
    await injectAndScan(page, '<button id="dr" x-drawer title="Filters" content="Status and owner live here.">Filters</button>');
    await expect(page.locator('#dr')).toHaveClass(/x-drawer--trigger/, { timeout: 15000 });
    await record(page, 'dr');
    await page.locator('#dr').click();
    await expect(page.locator('.x-drawer__panel--open')).toHaveCount(1);
    await expect.poll(() => events(page)).toEqual(['wb:drawer:open']);
    await page.keyboard.press('Escape');
    await expect(page.locator('.x-drawer__panel--open')).toHaveCount(0);
    await expect.poll(() => events(page)).toEqual(['wb:drawer:open', 'wb:drawer:close']);
  });

  test('tooltip fires show when the tip appears and hide when it goes', async ({ page }) => {
    await injectAndScan(page, '<button id="tt" x-tooltip="Helpful hint">Hover me</button>');
    await expect(page.locator('#tt')).toHaveClass(/x-tooltip/, { timeout: 15000 });
    await record(page, 'tt');
    await page.locator('#tt').hover();
    await expect(page.locator('.x-tooltip--visible')).toHaveCount(1);
    await expect.poll(() => events(page)).toEqual(['wb:tooltip:show']);
    await page.mouse.move(0, 0);
    await expect.poll(() => events(page)).toEqual(['wb:tooltip:show', 'wb:tooltip:hide']);
  });

  test('dropdown fires open and close as its menu opens and closes', async ({ page }) => {
    await injectAndScan(page, '<div id="dd" x-dropdown label="Assign to"><button type="button">Grace Hopper</button></div>');
    await expect(page.locator('#dd .x-dropdown__menu')).toHaveCount(1, { timeout: 15000 });
    await record(page, 'dd');
    const trigger = page.locator('#dd [aria-expanded]').first();
    await trigger.click();
    await expect(page.locator('#dd .x-dropdown__menu--open')).toHaveCount(1);
    await trigger.click();
    await expect(page.locator('#dd .x-dropdown__menu--open')).toHaveCount(0);
    await expect.poll(() => events(page)).toEqual(['wb:dropdown:open', 'wb:dropdown:close']);
  });

  test('cardlink fires click with its href and title', async ({ page }) => {
    await injectAndScan(page, '<article id="cl" x-cardlink title="Docs" href="#docs">Read the docs</article>');
    await expect(page.locator('#cl')).toHaveAttribute('x-ready', /.*/, { timeout: 15000 });
    await record(page, 'cl');
    await page.evaluate(() => document.getElementById('cl')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await expect.poll(() => events(page)).toEqual(['wb:cardlink:click']);
    expect(await details(page)).toEqual([{ href: '#docs', title: 'Docs' }]);
  });

  test('chip fires remove with its label', async ({ page }) => {
    await injectAndScan(page, '<div id="wrap"><span id="ch" x-chip dismissible>Design</span></div>');
    await expect(page.locator('#ch .x-chip__remove')).toHaveCount(1, { timeout: 15000 });
    await record(page, 'wrap');
    await page.locator('#ch .x-chip__remove').click();
    await expect.poll(() => events(page)).toEqual(['wb:chip:remove']);
    expect(await details(page)).toEqual([{ label: 'Design' }]);
  });

  test('table fires sort, filter and page', async ({ page }) => {
    const rows = ['Ada', 'Grace', 'Alan', 'Katherine'].map((n, i) => `<tr><td>${n}</td><td>${i}</td></tr>`).join('');
    await injectAndScan(page, `<div id="tw"><table id="tb" searchable paginated pageSize="2"><thead><tr><th>Name</th><th>Rank</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    await expect(page.locator('#tw .x-table__pager-btn')).toHaveCount(2, { timeout: 15000 });
    await record(page, 'tb');
    await page.locator('#tb th').first().click();
    await page.locator('#tw input[type="search"], #tw .x-table__search input, #tw input').first().fill('a');
    await page.locator('#tw .x-table__pager-btn', { hasText: 'Next' }).click();
    await expect.poll(() => events(page)).toEqual(['wb:table:sort', 'wb:table:filter', 'wb:table:page']);
    expect(await details(page)).toEqual([{ column: 'Name', direction: 'asc' }, { query: 'a' }, { page: 2 }]);
  });

  test('select fires change with the chosen value', async ({ page }) => {
    await injectAndScan(page, '<select id="se"><option value="a">A</option><option value="b">B</option></select>');
    await expect(page.locator('#se')).toHaveAttribute('x-ready', /.*/, { timeout: 15000 });
    await record(page, 'se');
    await page.locator('#se').selectOption('b');
    await expect.poll(() => events(page)).toEqual(['wb:select:change']);
    expect(await details(page)).toEqual([{ value: 'b' }]);
  });

  test('ripple fires show where the click landed', async ({ page }) => {
    await injectAndScan(page, '<button id="rp" x-ripple centered>Press</button>');
    await expect(page.locator('#rp')).toHaveAttribute('x-ready', /.*/, { timeout: 15000 });
    await record(page, 'rp');
    await page.locator('#rp').click();
    await expect.poll(() => events(page)).toEqual(['wb:ripple:show']);
  });

  test('drawer-layout fires toggle with its collapsed state', async ({ page }) => {
    await injectAndScan(page, '<aside id="dl2" x-drawer-layout>Sidebar</aside>');
    await expect(page.locator('#dl2')).toHaveAttribute('x-ready', /.*/, { timeout: 15000 });
    await record(page, 'dl2');
    await page.evaluate(() => (document.getElementById('dl2') as any).wbToggle());
    await expect.poll(() => events(page)).toEqual(['wb:drawerLayout:toggle']);
    expect(await details(page)).toEqual([{ collapsed: true }]);
  });

  test('confetti fires start, then end once the burst is gone', async ({ page }) => {
    await injectAndScan(page, '<div id="cf" x-confetti count="5"></div>');
    await expect(page.locator('#cf')).toHaveClass(/x-confetti--trigger/, { timeout: 15000 });
    await record(page, 'cf');
    await page.evaluate(() => document.getElementById('cf')!.click());
    await expect.poll(() => events(page)).toEqual(['wb:confetti:start']);
    await expect.poll(() => events(page), { timeout: 8000 }).toEqual(['wb:confetti:start', 'wb:confetti:end']);
  });
});
