/**
 * #344: every event a schema declares is one its behavior really fires.
 *
 * source-schema-compliance's "functions dispatch events defined in schema"
 * reads the source. This is the other half: it builds each behavior whose
 * dispatch #344 added, does the thing a user does, and waits for the event on
 * `document` -- so it also proves the event bubbles -- with the detail the
 * schema declares.
 *
 * No sleeps: every wait is for the event itself (or a WB signal), with
 * Playwright's own timeout as the failure.
 */
import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

interface Seen { type: string; detail: unknown }

/** Record every `types` event that bubbles to document, from now on. */
async function record(page: Page, types: string[]): Promise<void> {
  await page.evaluate((list) => {
    const w = window as any;
    w.__seen344 = [];
    for (const type of list) {
      document.addEventListener(type, (e) => {
        const detail = (e as CustomEvent).detail;
        w.__seen344.push({ type, detail: detail === undefined ? null : JSON.parse(JSON.stringify(detail)) });
      });
    }
  }, types);
}

/** Wait for the first recorded `type` event whose detail passes `match`. */
async function arrived(page: Page, type: string, match: Record<string, unknown> = {}): Promise<Seen> {
  const handle = await page.waitForFunction(({ t, m }) => {
    const seen = ((window as any).__seen344 || []) as Array<{ type: string; detail: any }>;
    return seen.find((s) => s.type === t
      && Object.entries(m).every(([k, v]) => JSON.stringify(s.detail?.[k]) === JSON.stringify(v))) || null;
  }, { t: type, m: match });
  return (await handle.jsonValue()) as Seen;
}

async function count(page: Page, type: string): Promise<number> {
  return page.evaluate((t) => ((window as any).__seen344 || []).filter((s: Seen) => s.type === t).length, type);
}

test.describe('#344 declared events are dispatched', () => {
  test('dropdown: wb:dropdown:open and wb:dropdown:close, once per change', async ({ page }) => {
    await injectAndScan(page, '<div x-dropdown label="Menu" items="One,Two"></div>');
    await record(page, ['wb:dropdown:open', 'wb:dropdown:close']);
    const trigger = page.locator('#test-container .x-dropdown__trigger');
    await trigger.click();
    await arrived(page, 'wb:dropdown:open');
    await trigger.click();
    await arrived(page, 'wb:dropdown:close');
    // An outside click on a closed menu is not a close.
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.locator('#test-container .x-dropdown__trigger').click();
    await arrived(page, 'wb:dropdown:open');
    expect(await count(page, 'wb:dropdown:close')).toBe(1);
    expect(await count(page, 'wb:dropdown:open')).toBe(2);
  });

  test('drawer: wb:drawer:open and wb:drawer:close carry position and variant', async ({ page }) => {
    await injectAndScan(page, '<button x-drawer title="Filters" content="Body" position="left">Open</button>');
    await record(page, ['wb:drawer:open', 'wb:drawer:close']);
    await page.locator('#test-container [x-drawer]').click();
    const open = await arrived(page, 'wb:drawer:open');
    expect(open.detail).toEqual({ position: 'left', variant: 'overlay' });
    await page.keyboard.press('Escape');
    const close = await arrived(page, 'wb:drawer:close');
    expect(close.detail).toEqual({ position: 'left', variant: 'overlay' });
    expect(await count(page, 'wb:drawer:close')).toBe(1);
  });

  test('dialog: wb:dialog:open, then cancel and close; OK closes without a cancel', async ({ page }) => {
    await injectAndScan(page, '<button x-dialog modalTitle="Delete branch?" modalContent="It goes for good.">Open</button>');
    await record(page, ['wb:dialog:open', 'wb:dialog:cancel', 'wb:dialog:close', 'wb:dialog:ok']);
    const trigger = page.locator('#test-container [x-dialog]');

    await trigger.click();
    const open = await arrived(page, 'wb:dialog:open');
    expect(open.detail).toEqual({ title: 'Delete branch?' });
    await page.locator('dialog.x-dialog .x-dialog__cancel').click();
    await arrived(page, 'wb:dialog:cancel');
    await arrived(page, 'wb:dialog:close');

    await trigger.click();
    await page.locator('dialog.x-dialog .x-dialog__ok').click();
    await arrived(page, 'wb:dialog:ok');
    await page.waitForFunction(() => ((window as any).__seen344 as Seen[]).filter((s) => s.type === 'wb:dialog:close').length === 2);
    expect(await count(page, 'wb:dialog:cancel')).toBe(1);
  });

  test('table: wb:table:sort, wb:table:filter and wb:table:page', async ({ page }) => {
    const rows = ['Delta', 'Alpha', 'Charlie', 'Bravo', 'Echo']
      .map((n, i) => `<tr><td>${n}</td><td>${i}</td></tr>`).join('');
    await injectAndScan(page,
      `<table sortable searchable paginated pageSize="2"><thead><tr><th>Name</th><th>Rank</th></tr></thead><tbody>${rows}</tbody></table>`);
    await record(page, ['wb:table:sort', 'wb:table:filter', 'wb:table:page']);

    await page.locator('#test-container th', { hasText: 'Name' }).click();
    const sort = await arrived(page, 'wb:table:sort');
    expect(sort.detail).toEqual({ column: 'Name', index: 0, direction: 'asc' });

    await page.locator('#test-container .x-table__pager-btn', { hasText: 'Next' }).click();
    const paged = await arrived(page, 'wb:table:page');
    expect(paged.detail).toEqual({ page: 2, pages: 3 });

    await page.locator('#test-container .x-table__search').fill('ha');
    const filter = await arrived(page, 'wb:table:filter', { query: 'ha' });
    expect(filter.detail).toEqual({ query: 'ha', matches: 2 });
  });

  test('select: wb:select:change carries the value, and every value for multiple', async ({ page }) => {
    await injectAndScan(page, [
      '<select id="one"><option value="a">A</option><option value="b">B</option></select>',
      '<select id="many" multiple><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select>',
    ].join(''));
    await record(page, ['wb:select:change']);
    await page.locator('#one').selectOption('b');
    expect((await arrived(page, 'wb:select:change', { value: 'b' })).detail).toEqual({ value: 'b' });
    await page.locator('#many').selectOption(['x', 'z']);
    expect((await arrived(page, 'wb:select:change', { value: ['x', 'z'] })).detail).toEqual({ value: ['x', 'z'] });
  });

  test('chip: wb:chip:remove carries the label', async ({ page }) => {
    await injectAndScan(page, '<span x-chip dismissible>Urgent</span>');
    await record(page, ['wb:chip:remove']);
    await page.locator('#test-container .x-chip__remove').click();
    const removed = await arrived(page, 'wb:chip:remove');
    expect(removed.detail).toEqual({ label: 'Urgent' });
  });

  test('drawer-layout: wb:drawerLayout:toggle carries collapsed', async ({ page }) => {
    await injectAndScan(page, '<aside x-drawer-layout position="left" width="220px" minWidth="64px"><nav><a href="#">Overview</a></nav></aside>');
    await record(page, ['wb:drawerLayout:toggle']);
    const toggle = page.locator('#test-container .x-drawerlayout__toggle');
    await toggle.click();
    expect((await arrived(page, 'wb:drawerLayout:toggle', { collapsed: true })).detail).toEqual({ collapsed: true });
    await toggle.click();
    expect((await arrived(page, 'wb:drawerLayout:toggle', { collapsed: false })).detail).toEqual({ collapsed: false });
  });

  test('notes: wb:notes:copy carries what was copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await injectAndScan(page, '<aside x-notes position="right"></aside>');
    await page.waitForFunction(() => !!(document.querySelector('#test-container [x-notes]') as any)?.wbNotes);
    await record(page, ['wb:notes:copy']);
    await page.evaluate(() => {
      const api = (document.querySelector('#test-container [x-notes]') as any).wbNotes;
      api.content = 'remember the milk';
      return api.copy();
    });
    const copied = await arrived(page, 'wb:notes:copy');
    expect(copied.detail).toEqual({ content: 'remember the milk' });
  });

  test('confetti, fireworks and snow: start with a count, then end/stop', async ({ page }) => {
    await injectAndScan(page, [
      '<div x-confetti count="4"></div>',
      '<div x-fireworks count="5" duration="300ms"></div>',
      '<div x-snow count="3" duration="300ms"></div>',
    ].join(''));
    await record(page, ['wb:confetti:start', 'wb:confetti:end', 'wb:fireworks:start', 'wb:fireworks:end', 'wb:snow:start', 'wb:snow:stop']);
    await page.locator('#test-container [x-fireworks]').click();
    expect((await arrived(page, 'wb:fireworks:start')).detail).toEqual({ count: 5 });
    await arrived(page, 'wb:fireworks:end');
    await page.locator('#test-container [x-snow]').click();
    expect((await arrived(page, 'wb:snow:start')).detail).toEqual({ count: 3 });
    await arrived(page, 'wb:snow:stop');
    await page.locator('#test-container [x-confetti]').click();
    expect((await arrived(page, 'wb:confetti:start')).detail).toEqual({ count: 4 });
    // confetti clears its pieces after a fixed 5s; the wait is for the event.
    await arrived(page, 'wb:confetti:end');
  });

  test('audio: play, pause, ended, volumechange and eqchange reach the host', async ({ page }) => {
    await injectAndScan(page, '<div x-audio src="/tests/fixtures/media/sample.wav" show-eq muted></div>');
    await page.waitForFunction(() => !!(document.querySelector('#test-container [x-audio]') as any)?.wbAudio);
    await record(page, ['wb:audio:play', 'wb:audio:pause', 'wb:audio:ended', 'wb:audio:volumechange', 'wb:audio:eqchange']);

    await page.evaluate(() => (document.querySelector('#test-container [x-audio]') as any).wbAudio.setVolume(0.3));
    expect((await arrived(page, 'wb:audio:volumechange', { volume: 0.3, muted: true })).detail).toEqual({ volume: 0.3, muted: true });

    await page.locator('#test-container .x-audio__eq-slider').first().fill('5');
    expect((await arrived(page, 'wb:audio:eqchange', { band: 0, gain: 5 })).detail).toEqual({ band: 0, gain: 5 });

    await page.evaluate(() => (document.querySelector('#test-container [x-audio]') as any).wbAudio.play());
    expect((await arrived(page, 'wb:audio:play')).type).toBe('wb:audio:play');
    await page.evaluate(() => (document.querySelector('#test-container [x-audio]') as any).wbAudio.pause());
    expect((await arrived(page, 'wb:audio:pause')).type).toBe('wb:audio:pause');
    await page.evaluate(() => {
      const audio = document.querySelector('#test-container [x-audio] audio') as HTMLAudioElement;
      audio.currentTime = Math.max(0, audio.duration - 0.2);
      return audio.play();
    });
    expect((await arrived(page, 'wb:audio:ended')).type).toBe('wb:audio:ended');
  });

  test('cardvideo: wb:cardvideo:play, pause and ended carry currentTime', async ({ page }) => {
    await injectAndScan(page, '<article x-cardvideo src="/tests/fixtures/offline/media/video/sample-clip.webm" muted title="Clip"></article>');
    await page.waitForFunction(() => {
      const v = document.querySelector('#test-container video') as HTMLVideoElement | null;
      return !!v && v.readyState >= 1;
    });
    await record(page, ['wb:cardvideo:play', 'wb:cardvideo:pause', 'wb:cardvideo:ended']);
    await page.evaluate(() => (document.querySelector('#test-container video') as HTMLVideoElement).play());
    const played = await arrived(page, 'wb:cardvideo:play');
    expect(typeof (played.detail as { currentTime: unknown }).currentTime).toBe('number');
    await page.evaluate(() => (document.querySelector('#test-container video') as HTMLVideoElement).pause());
    await arrived(page, 'wb:cardvideo:pause');
    await page.evaluate(() => {
      const v = document.querySelector('#test-container video') as HTMLVideoElement;
      v.currentTime = Math.max(0, v.duration - 0.2);
      return v.play();
    });
    await arrived(page, 'wb:cardvideo:ended');
  });
});
