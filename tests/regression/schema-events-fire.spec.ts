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

/** Every wb:* event that reaches `id`, in order, as `name`. */
async function record(page: Page, id: string) {
  await page.evaluate((elId) => {
    const el = document.getElementById(elId)!;
    (window as any).__events = [];
    for (const name of ['play', 'pause', 'ended', 'volumechange', 'eqchange', 'timeupdate', 'open', 'close', 'cancel', 'show', 'hide']) {
      for (const prefix of ['audio', 'video', 'dialog', 'drawer', 'tooltip', 'dropdown']) {
        el.addEventListener(`wb:${prefix}:${name}`, () => (window as any).__events.push(`wb:${prefix}:${name}`));
      }
    }
  }, id);
}

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
});
