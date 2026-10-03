import { test, expect, Page } from '../fixtures/offline';

/**
 * x-glass (#1236): an element carries the background scene.
 *
 * John, on the playground's hero #7: "a button which carries the scene of the
 * background" -- the wave runs straight through the "Read the Guide" button.
 * These hold the three things that make that true:
 *
 *  1. The scene really passes through: over a background split hard into two
 *     colours, the button's left half and right half pick up different
 *     colours. A solid button in the same place stays one colour.
 *  2. amount changes how much tint is mixed in (most < some < least), capped
 *     at 30%.
 *  3. The card hero's "Read the Guide" button is x-glass and renders exactly as
 *     it did before the behavior existed: white at 14%, a 1.5px white edge at
 *     40%, an 8px softening.
 */

async function openSite(page: Page) {
  await page.goto('index.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
}

/** The alpha of a computed colour, whatever notation the browser serialises. */
const ALPHA_OF = `(c) => {
  const m = /\\/\\s*([\\d.]+)\\s*\\)$/.exec(c) || /rgba\\([^,]+,[^,]+,[^,]+,\\s*([\\d.]+)\\)/.exec(c);
  return m ? Number(m[1]) : 1;
}`;

test('the scene passes through an x-glass button, and not through a solid one', async ({ page }) => {
  await openSite(page);
  await page.evaluate(async () => {
    const stage = document.createElement('div');
    stage.id = 'glass-stage';
    // A hard split: red on the left half, blue on the right. Whatever is
    // behind the button is now known exactly, pixel by pixel.
    stage.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;padding:40px;width:400px;'
      + 'background:linear-gradient(to right, rgb(220,30,30) 50%, rgb(30,30,220) 50%);';
    stage.innerHTML =
      '<button id="glass-btn" x-glass style="display:block;width:320px;height:60px;color:transparent">x</button>' +
      '<button id="solid-btn" style="display:block;width:320px;height:60px;margin-top:20px;background:rgb(240,240,240);border:0;color:transparent">x</button>';
    document.body.appendChild(stage);
    await (window as any).WB.scan(stage);
  });
  const glass = page.locator('#glass-btn');
  await expect(glass).toHaveClass(/\bx-glass\b/);
  await expect(glass).toHaveClass(/\bx-glass--most\b/);

  // Sample just inside the left and right edges of each button, mid-height.
  const sample = async (sel: string) => {
    const box = (await page.locator(sel).boundingBox())!;
    const shot = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    return page.evaluate(async ({ b64, w, h }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const sx = img.width / w;
      const at = (x: number) => Array.from(ctx.getImageData(Math.round(x * sx), Math.round((h / 2) * sx), 1, 1).data.slice(0, 3));
      return { left: at(30), right: at(w - 30) };
    }, { b64: shot.toString('base64'), w: box.width, h: box.height });
  };
  const g = await sample('#glass-btn');
  const s = await sample('#solid-btn');

  // Through glass: the left half is red-dominant and the right blue-dominant.
  expect(g.left[0], `left of x-glass button ${g.left}`).toBeGreaterThan(g.left[2] + 60);
  expect(g.right[2], `right of x-glass button ${g.right}`).toBeGreaterThan(g.right[0] + 60);
  // Control: the solid button is one colour across, the scene does not show.
  const diff = s.left.reduce((n, v, i) => n + Math.abs(v - s.right[i]), 0);
  expect(diff, `solid button left ${s.left} vs right ${s.right}`).toBeLessThan(10);
});

test('amount sets how much tint is mixed in: most < some < least, at most 30%', async ({ page }) => {
  await openSite(page);
  const alphas = await page.evaluate(async (alphaOf) => {
    const alpha = new Function('return ' + alphaOf)();
    const wrap = document.createElement('div');
    wrap.innerHTML = ['most', 'some', 'least'].map((a) => `<button x-glass amount="${a}">${a}</button>`).join('');
    document.body.appendChild(wrap);
    await (window as any).WB.scan(wrap);
    const out = Array.from(wrap.querySelectorAll('button')).map((b) => ({
      cls: b.className,
      alpha: alpha(getComputedStyle(b).backgroundColor),
      image: getComputedStyle(b).backgroundImage,
    }));
    wrap.remove();
    return out;
  }, ALPHA_OF);

  expect(alphas.map((a) => a.cls)).toEqual([
    expect.stringMatching(/x-glass--most/), expect.stringMatching(/x-glass--some/), expect.stringMatching(/x-glass--least/),
  ]);
  for (const a of alphas) expect(a.image, 'x-glass must not paint a picture of its own').toBe('none');
  const [most, some, least] = alphas.map((a) => a.alpha);
  expect(most).toBeCloseTo(0.14, 2);
  expect(some).toBeCloseTo(0.22, 2);
  expect(least).toBeCloseTo(0.30, 2);
});

test('the card hero\'s "Read the Guide" is x-glass and looks exactly as before', async ({ page }) => {
  await openSite(page);
  const got = await page.evaluate(async () => {
    const hero = document.createElement('section');
    hero.setAttribute('x-cardhero', '');
    hero.setAttribute('title', 'Infinite Possibility.');
    hero.setAttribute('cta', 'Try the Playground');
    hero.setAttribute('cta-secondary', 'Read the Guide');
    document.body.appendChild(hero);
    await (window as any).WB.scan();
    if ((window as any).WB.whenIdle) await (window as any).WB.whenIdle({ timeout: 10_000 });
    const btn = hero.querySelector('.x-hero-cta--secondary') as HTMLElement;
    // x-glass is set on the button when the hero builds it, then picked up by
    // auto-injection, which loads glass.css on first use. Wait for the
    // stylesheet to land rather than reading before it has.
    const t0 = performance.now();
    while (getComputedStyle(btn).backdropFilter !== 'blur(8px)' && performance.now() - t0 < 10_000) {
      await new Promise((r) => setTimeout(r, 50));
    }
    // .x-hero-cta transitions its background (0.2s), so the fill fades in when
    // glass.css lands. Read the resting value, not a frame of the fade.
    btn.getAnimations().forEach((a) => a.finish());
    const cs = getComputedStyle(btn);
    return {
      attr: btn.hasAttribute('x-glass'),
      cls: btn.className,
      background: cs.backgroundColor,
      // The hero's edge setting, not the computed border width: Chromium
      // reports a 1.5px border as 1px (measured at 1x and 2x), exactly as it
      // did for the old hand-written `border: 1.5px`.
      edgeWidth: cs.getPropertyValue('--x-glass-edge-width').trim(),
      borderColor: cs.borderTopColor,
      backdrop: cs.backdropFilter,
    };
  });
  expect(got.attr).toBe(true);
  expect(got.cls).toMatch(/\bx-glass\b/);
  // The values hero.css hand-wrote before x-glass existed.
  expect(got.background.replace(/\s/g, '')).toMatch(/^(rgba\(255,255,255,0\.14\)|color\(srgb111\/0\.14\))$/);
  expect(got.edgeWidth).toBe('1.5px');
  expect(got.borderColor.replace(/\s/g, '')).toMatch(/^(rgba\(255,255,255,0\.4\)|color\(srgb111\/0\.4\))$/);
  expect(got.backdrop).toBe('blur(8px)');
});
