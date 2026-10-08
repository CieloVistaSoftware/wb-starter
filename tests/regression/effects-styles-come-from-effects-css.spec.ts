import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #817: effects were styled two ways. Most rules lived in effects.css, but
 * confetti, sparkle, rainbow, fireworks, snow, particle, ripple, sticky and
 * stagelight each appended their own <style> the first time they ran, so
 * which half of an effect lived where was invisible from the outside. Every
 * one of them is now styled by effects.css alone.
 *
 * This runs each effect and checks two things: none of the <style> tags the
 * effects used to append appears, and every @keyframes an effect animates
 * with is defined by a stylesheet, so removing the injection did not leave an
 * animation that names keyframes nobody defines.
 */

const MARKUP = `
  <button id="cf" x-confetti count="3">Confetti</button>
  <button id="sp" x-sparkle count="3">Sparkle</button>
  <span id="rb" x-rainbow>Rainbow</span>
  <button id="fw" x-fireworks>Fireworks</button>
  <button id="sn" x-snow count="3">Snow</button>
  <div id="pt" x-particle count="3" style="height: 60px"></div>
  <button id="rp" x-ripple>Ripple</button>
  <header id="st" x-sticky>Sticky</header>
  <div id="sl" x-stagelight>Stage</div>`;

/** The ids of the <style> tags the effects appended before #817. */
const EFFECT_STYLE_IDS = [
  'x-confetti-styles', 'x-sparkle-styles', 'x-rainbow-styles', 'x-firework-styles',
  'x-snow-styles', 'x-particle-styles', 'x-ripple-styles', 'x-sticky-styles', 'x-stagelight-styles',
];

const KEYFRAMES = [
  'x-confetti-fall', 'x-confetti-gradient', 'x-sparkle', 'x-rainbow',
  'x-firework-particle', 'x-snow-fall', 'x-particle-float', 'x-ripple-animation',
];

test('running every effect adds none of its old <style> tags, and the keyframes they use are in a stylesheet', async ({ page }) => {
  await injectAndScan(page, MARKUP);

  // Fire the ones that build their particles or waves on a click.
  for (const id of ['cf', 'sp', 'fw', 'sn', 'rp']) {
    await page.evaluate((elId) => {
      const el = document.getElementById(elId)!;
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.click();
    }, id);
  }

  // Other behaviors still have their own (x-button-styles, from the <button>
  // semantic); only the effects' are checked here.
  const injected = await page.evaluate((ids) =>
    ids.filter((id) => document.getElementById(id)), EFFECT_STYLE_IDS);
  expect(injected, 'no effect injects its own <style>').toEqual([]);

  const defined = await page.evaluate(() => {
    const names = new Set<string>();
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of [...rules]) if (rule instanceof CSSKeyframesRule) names.add(rule.name);
    }
    return [...names];
  });
  for (const name of KEYFRAMES) expect(defined, `@keyframes ${name}`).toContain(name);
});
