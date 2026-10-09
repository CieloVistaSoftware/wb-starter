/**
 * THE PLAYGROUND'S EDITOR BEHAVES LIKE AN HTML EDITOR (#265)
 * =========================================================
 * #265 asked three things of demos/playground.html's source box: Enter makes
 * a new line, a Format action, and IntelliSense. Enter and Format were done,
 * with no test; Tab moved focus out of the editor, and nothing offered a
 * completion. This holds all of it:
 *
 *   - Enter: a new line, carrying the indent (one level more inside an
 *     unclosed tag).
 *   - Tab: two spaces, focus stays; Shift+Tab takes them back; Escape then
 *     Tab leaves the editor, so a keyboard user is never trapped.
 *   - Format: the buffer becomes formatHtml()'s §5 layout.
 *   - Completions: typing `x-car` inside a tag offers x-card; Enter accepts
 *     it. Inside a tag that carries x-card, typing `vari` offers its schema
 *     option `variant`.
 *
 * See it by hand: open /demos/playground.html, click into the source, type
 * `<div x-car`. Before: nothing. Now: a list under the caret offering x-card.
 */
import { test, expect, type Page } from '../fixtures/offline';
import { completionContext, suggest } from '../../src/lib/html-editor-assist.js';

const EDITOR = '#pg-input';
const LIST = '.pg-assist';

async function openEditor(page: Page, value = '') {
  await page.goto('/demos/playground.html');
  const editor = page.locator(EDITOR);
  await expect(editor).toBeVisible();
  // The page loads a sample; start from a known buffer.
  await editor.evaluate((el, v) => { (el as HTMLTextAreaElement).value = v; }, value);
  await editor.focus();
  await editor.evaluate((el) => {
    const t = el as HTMLTextAreaElement;
    t.setSelectionRange(t.value.length, t.value.length);
  });
  return editor;
}

const valueOf = (page: Page) => page.locator(EDITOR).evaluate((el) => (el as HTMLTextAreaElement).value);

test.describe('playground editor (#265)', () => {
  test('Enter starts a new line with the indent carried, one level deeper inside an open tag', async ({ page }) => {
    await openEditor(page, '<div>\n  <p');
    await page.keyboard.press('Enter');
    expect(await valueOf(page)).toBe('<div>\n  <p\n    ');
  });

  test('Tab indents two spaces and keeps focus; Shift+Tab takes them back', async ({ page }) => {
    await openEditor(page, '<div>');
    await page.keyboard.press('Tab');
    expect(await valueOf(page)).toBe('<div>  ');
    await expect(page.locator(EDITOR)).toBeFocused();

    await openEditor(page, '    <p>');
    await page.keyboard.press('Shift+Tab');
    expect(await valueOf(page)).toBe('  <p>');
    await expect(page.locator(EDITOR)).toBeFocused();
  });

  test('Escape, then Tab, leaves the editor', async ({ page }) => {
    await openEditor(page, '<div>');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(page.locator(EDITOR)).not.toBeFocused();
    expect(await valueOf(page)).toBe('<div>');
  });

  test('Format lays the buffer out the way formatHtml does', async ({ page }) => {
    const src = '<article x-card title="Hello" subtitle="World" variant="glass"><p>Body</p></article>';
    await openEditor(page, src);
    const expected = await page.evaluate(async (s) => {
      const m = await import('/src/wb-viewmodels/demo.js');
      return m.formatHtml(s);
    }, src);
    expect(expected, 'formatHtml should change this one-line source').not.toBe(src);
    await page.locator('#pg-format').click();
    expect(await valueOf(page)).toBe(expected);
  });

  test('typing x-car inside a tag offers x-card, and Enter accepts it', async ({ page }) => {
    await openEditor(page, '<div ');
    await page.keyboard.type('x-car');
    const list = page.locator(LIST);
    await expect(list).toBeVisible();
    await expect(list.locator('.pg-assist__label').first()).toHaveText('x-card');
    // The list sits inside the editor panel, under the text, not off in a corner.
    const [box, editorBox] = await Promise.all([list.boundingBox(), page.locator(EDITOR).boundingBox()]);
    expect(box && editorBox && box.y >= editorBox.y && box.y < editorBox.y + editorBox.height).toBe(true);

    await page.keyboard.press('Enter');
    expect(await valueOf(page)).toBe('<div x-card');
    await expect(list).toBeHidden();
  });

  test("inside a tag that carries x-card, typing vari offers the card's variant option", async ({ page }) => {
    await openEditor(page, '<article x-card ');
    await page.keyboard.type('vari');
    const list = page.locator(LIST);
    await expect(list).toBeVisible();
    await expect(list.locator('.pg-assist__label')).toContainText(['variant']);
    await page.keyboard.press('Tab');
    expect(await valueOf(page)).toBe('<article x-card variant');
  });

  test('Escape closes the list without changing the text', async ({ page }) => {
    await openEditor(page, '<div ');
    await page.keyboard.type('x-ti');
    await expect(page.locator(LIST)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(LIST)).toBeHidden();
    expect(await valueOf(page)).toBe('<div x-ti');
    await expect(page.locator(EDITOR)).toBeFocused();
  });
});

test.describe('completion rules (#265)', () => {
  const data = {
    behaviors: { 'x-card': 'card', 'x-cart': 'cart', 'x-tooltip': 'tooltip' },
    schemas: { card: { description: 'A card.', properties: { variant: { description: 'Look.' }, size: {} } } },
  };

  test('completes only an attribute name inside a start tag', () => {
    expect(completionContext('<div x-car', 10)).toMatchObject({ prefix: 'x-car', start: 5 });
    expect(completionContext('<div x-car>', 11)).toBeNull();          // past the tag
    expect(completionContext('</div x-car', 11)).toBeNull();          // a closing tag
    expect(completionContext('<div title="x-car', 17)).toBeNull();    // inside a value
    expect(completionContext('x-car', 5)).toBeNull();                 // text, not a tag
  });

  test('offers behaviors for x-, the tag behaviors\' options otherwise, and nothing already typed', () => {
    expect(suggest({ prefix: 'x-car', tagText: '<div x-car' }, data).map((s) => s.label)).toEqual(['x-card', 'x-cart']);
    expect(suggest({ prefix: 'x-car', tagText: '<div x-card x-car' }, data).map((s) => s.label)).toEqual(['x-cart']);
    expect(suggest({ prefix: 'v', tagText: '<div x-card v' }, data).map((s) => s.label)).toEqual(['variant']);
    expect(suggest({ prefix: 'v', tagText: '<div v' }, data)).toEqual([]);
  });
});
