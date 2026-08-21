/**
 * Effect-based coverage for the "🔘 Button" section of demos/site/forms.html:
 * <wb-button> (src/wb-viewmodels/semantics/button.js), its x-* composition
 * examples (ripple.js, tooltip.js, feedback.js's toast(), copy.js), and the
 * native <button variant size> semantic-element mapping path (same
 * semantics/button.js file, "native <button>" branch).
 *
 * Standard DEMOS-AND-DOCS-STANDARDS.md #19: every declared attribute must be
 * proven to produce its REAL effect (computed style diff / DOM mutation /
 * event payload) -- not just "the element rendered".
 *
 * Setup pattern copied from tests/behaviors/wb-demo-width-and-toggle.spec.ts:
 * goto the lightweight test-harness page, inject markup, then
 * WB.scan(document.body, { eager: true }) so behaviors attach synchronously
 * before any interaction is dispatched (TIER1 gotcha -- lazy IntersectionObserver
 * scan can leave listeners unattached for a one-shot click/keypress).
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string, id = 'wb-button-effect-area'): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate(({ h, containerId }) => {
    const c = document.createElement('div');
    c.id = containerId;
    c.innerHTML = h;
    document.body.appendChild(c);
  }, { h: html, containerId: id });
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true });
  });
  await page.waitForTimeout(400);
}

test.describe('<wb-button> variant -- computed background-color actually differs', () => {
  test('variant="primary" vs variant="danger" produce different computed background-color', async ({ page }) => {
    await setup(page, `
      <wb-button id="v-primary" variant="primary">Primary</wb-button>
      <wb-button id="v-danger" variant="danger">Danger</wb-button>
    `);
    const primaryBg = await page.locator('#v-primary').evaluate(el => getComputedStyle(el).backgroundColor);
    const dangerBg = await page.locator('#v-danger').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(primaryBg).not.toBe(dangerBg);
    // Neither should be the un-styled fallback (transparent) -- proves the
    // attribute-selector CSS actually matched, not just "differs from each other".
    expect(primaryBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(dangerBg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('variant="error" (the schema-declared alias for danger) matches variant="danger" color', async ({ page }) => {
    await setup(page, `
      <wb-button id="v-danger2" variant="danger">Danger</wb-button>
      <wb-button id="v-error" variant="error">Error</wb-button>
    `);
    const dangerBg = await page.locator('#v-danger2').evaluate(el => getComputedStyle(el).backgroundColor);
    const errorBg = await page.locator('#v-error').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(errorBg).toBe(dangerBg);
  });
});

test.describe('<wb-button> size -- computed dimensions actually differ', () => {
  test('size="xs" vs size="xl" produce different computed font-size and height', async ({ page }) => {
    await setup(page, `
      <wb-button id="s-xs" variant="primary" size="xs">XS</wb-button>
      <wb-button id="s-xl" variant="primary" size="xl">XL</wb-button>
    `);
    const xs = await page.locator('#s-xs').evaluate(el => {
      const cs = getComputedStyle(el);
      return { fontSize: parseFloat(cs.fontSize), height: el.getBoundingClientRect().height };
    });
    const xl = await page.locator('#s-xl').evaluate(el => {
      const cs = getComputedStyle(el);
      return { fontSize: parseFloat(cs.fontSize), height: el.getBoundingClientRect().height };
    });
    expect(xl.fontSize).toBeGreaterThan(xs.fontSize);
    expect(xl.height).toBeGreaterThan(xs.height);
  });
});

test.describe('<wb-button disabled> -- actually blocks interaction, not just present', () => {
  test('Enter key fires click on an enabled button but not on a disabled twin', async ({ page }) => {
    await setup(page, `
      <wb-button id="b-enabled" variant="primary">Enabled</wb-button>
      <wb-button id="b-disabled" variant="primary" disabled>Disabled</wb-button>
    `);
    await page.evaluate(() => {
      (window as any).__clicks = { enabled: 0, disabled: 0 };
      document.getElementById('b-enabled')!.addEventListener('click', () => (window as any).__clicks.enabled++);
      document.getElementById('b-disabled')!.addEventListener('click', () => (window as any).__clicks.disabled++);
    });

    await page.locator('#b-disabled').focus();
    await page.keyboard.press('Enter');
    await page.locator('#b-enabled').focus();
    await page.keyboard.press('Enter');

    const clicks = await page.evaluate(() => (window as any).__clicks);
    expect(clicks.disabled).toBe(0);
    expect(clicks.enabled).toBe(1);
  });

  test('disabled button has pointer-events: none (enabled twin does not)', async ({ page }) => {
    await setup(page, `
      <wb-button id="pe-enabled" variant="primary">Enabled</wb-button>
      <wb-button id="pe-disabled" variant="primary" disabled>Disabled</wb-button>
    `);
    const enabledPE = await page.locator('#pe-enabled').evaluate(el => getComputedStyle(el).pointerEvents);
    const disabledPE = await page.locator('#pe-disabled').evaluate(el => getComputedStyle(el).pointerEvents);
    expect(disabledPE).toBe('none');
    expect(enabledPE).not.toBe('none');
  });
});

test.describe('<wb-button loading> -- structurally distinct from non-loading', () => {
  test('a spinner element renders only on the loading button', async ({ page }) => {
    await setup(page, `
      <wb-button id="l-plain" variant="primary">Plain</wb-button>
      <wb-button id="l-loading" variant="primary" loading>Loading</wb-button>
    `);
    await expect(page.locator('#l-plain .wb-button__spinner')).toHaveCount(0);
    await expect(page.locator('#l-loading .wb-button__spinner')).toHaveCount(1);
  });

  test('loading button has cursor: not-allowed (plain twin does not)', async ({ page }) => {
    await setup(page, `
      <wb-button id="lc-plain" variant="primary">Plain</wb-button>
      <wb-button id="lc-loading" variant="primary" loading>Loading</wb-button>
    `);
    const plainCursor = await page.locator('#lc-plain').evaluate(el => getComputedStyle(el).cursor);
    const loadingCursor = await page.locator('#lc-loading').evaluate(el => getComputedStyle(el).cursor);
    expect(loadingCursor).toBe('not-allowed');
    expect(plainCursor).not.toBe('not-allowed');
  });
});

test.describe('<wb-button icon icon-position> -- a real icon node renders on the correct side', () => {
  test('icon="star" renders an actual <svg> inside .wb-button__icon', async ({ page }) => {
    await setup(page, `<wb-button id="ic-star" variant="primary" icon="star">Star</wb-button>`);
    const iconHost = page.locator('#ic-star .wb-button__icon');
    await expect(iconHost).toHaveCount(1);
    await expect(iconHost.locator('svg')).toHaveCount(1);
  });

  test('icon-position="start" places the icon before the label text (DOM order)', async ({ page }) => {
    await setup(page, `<wb-button id="ic-start" variant="primary" icon="star" icon-position="start">Label</wb-button>`);
    const firstIsIcon = await page.locator('#ic-start').evaluate(el => {
      const first = el.childNodes[0];
      return first.nodeType === Node.ELEMENT_NODE && (first as Element).classList.contains('wb-button__icon');
    });
    expect(firstIsIcon).toBe(true);
  });

  test('icon-position="end" places the icon after the label text (DOM order)', async ({ page }) => {
    await setup(page, `<wb-button id="ic-end" variant="primary" icon="star" icon-position="end">Label</wb-button>`);
    const lastIsIcon = await page.locator('#ic-end').evaluate(el => {
      const last = el.childNodes[el.childNodes.length - 1];
      return last.nodeType === Node.ELEMENT_NODE && (last as Element).classList.contains('wb-button__icon');
    });
    expect(lastIsIcon).toBe(true);
    // And confirm start vs end actually differ in order, not both landing in the same spot.
    const firstIsIcon = await page.locator('#ic-end').evaluate(el => {
      const first = el.childNodes[0];
      return first.nodeType === Node.ELEMENT_NODE && (first as Element).classList.contains('wb-button__icon');
    });
    expect(firstIsIcon).toBe(false);
  });
});

test.describe('<wb-button full-width> -- SUSPECTED BUG: attribute is declared but has no effect', () => {
  // src/wb-models/button.schema.json declares fullWidth with
  // appliesClass: "wb-button--full", and demos/site/forms.html renders
  // <wb-button full-width>full-width</wb-button> (line ~206). But:
  //   - src/wb-viewmodels/semantics/button.js never reads the `full-width`
  //     attribute at all (only handles icon/iconPosition/loading/disabled).
  //   - src/styles/behaviors/button.css has no `.wb-button--full` rule, and
  //     BUTTON_CSS in button.js's own injected <style> has no
  //     `wb-button[full-width]` rule either.
  // Net effect: the attribute is fully inert. Verified by reading both files
  // (no fix applied here per project rule -- product code under src/ is not
  // touched by this test-writing task).
  test.fixme('full-width button is wider than a sibling without it', async ({ page }) => {
    await setup(page, `
      <div id="fw-container" style="width: 600px;">
        <wb-button id="fw-plain" variant="primary">Plain</wb-button>
        <wb-button id="fw-full" variant="primary" full-width>Full width</wb-button>
      </div>
    `);
    const plainWidth = await page.locator('#fw-plain').evaluate(el => el.getBoundingClientRect().width);
    const fullWidth = await page.locator('#fw-full').evaluate(el => el.getBoundingClientRect().width);
    expect(fullWidth).toBeGreaterThan(plainWidth);
  });
});

test.describe('<wb-button icon-only> -- SUSPECTED BUG: attribute is declared but has no effect', () => {
  // Same shape of gap as full-width: button.schema.json declares iconOnly
  // (appliesClass: "wb-button--icon-only"), demos/site/forms.html renders
  // <wb-button icon-only>icon-only</wb-button> (line ~209), but
  // semantics/button.js never reads `icon-only` and button.css has no
  // `.wb-button--icon-only` rule -- the label text is never hidden and no
  // square/icon-only layout is ever applied.
  test.fixme('icon-only button hides its visible label text', async ({ page }) => {
    await setup(page, `<wb-button id="io" variant="primary" icon="star" icon-only>icon-only label</wb-button>`);
    const labelVisible = await page.locator('#io').evaluate(el => el.textContent?.includes('icon-only label'));
    // Today this is `true` (bug); once fixed, the visible label text should
    // be suppressed (aria-label used instead) and this should read false.
    expect(labelVisible).toBe(false);
  });
});

test.describe('x-ripple -- a real ripple DOM element appears on click, then is removed', () => {
  test('click produces a .wb-ripple__wave that disappears after its animation duration', async ({ page }) => {
    await setup(page, `<wb-button id="rip" variant="primary" x-ripple>Ripple</wb-button>`);
    await page.locator('#rip').click();
    // Default ripple-duration is 600ms -- check immediately after click while
    // the wave element should still be present (it's appended synchronously
    // in the mousedown handler, removed via setTimeout after config.duration).
    await expect(page.locator('#rip .wb-ripple__wave')).toHaveCount(1);
    await page.waitForTimeout(900);
    await expect(page.locator('#rip .wb-ripple__wave')).toHaveCount(0);
  });
});

test.describe('x-tooltip -- hover shows a tooltip element containing the specified text', () => {
  test('hovering the trigger shows a visible tooltip with the configured content', async ({ page }) => {
    await setup(page, `<wb-button id="tip" variant="secondary" x-tooltip="Helpful hint" position="top">Tooltip</wb-button>`);
    await expect(page.locator('.wb-tooltip--visible')).toHaveCount(0);
    await page.locator('#tip').hover();
    // tooltip.js's default show delay is 200ms.
    await expect(page.locator('.wb-tooltip--visible')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('.wb-tooltip--visible')).toHaveText('Helpful hint');
  });
});

test.describe('x-toast -- click fires a real toast notification', () => {
  test('clicking dispatches wb:toast:show and renders a toast with the configured message/variant', async ({ page }) => {
    await setup(page, `<wb-button id="tst" variant="success" x-toast message="Saved!" toast-variant="success">Toast on click</wb-button>`);
    const eventDetail = page.evaluate(() => new Promise(resolve => {
      document.getElementById('tst')!.addEventListener('wb:toast:show', (e: any) => resolve(e.detail), { once: true });
    }));
    await page.locator('#tst').click();
    const detail: any = await eventDetail;
    expect(detail.message).toBe('Saved!');
    expect(detail.variant).toBe('success');

    const toast = page.locator('.wb-toast-container .wb-toast--success');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveText('Saved!');
  });
});

test.describe('x-copy -- click actually writes the specified text to the clipboard', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('clicking copies copy-text to the clipboard and shows the copied-feedback effect', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setup(page, `<wb-button id="cpy" variant="info" x-copy copy-text="Copied from a wb-button!">Copy to clipboard</wb-button>`);

    const eventDetail = page.evaluate(() => new Promise(resolve => {
      document.getElementById('cpy')!.addEventListener('wb:copy:success', (e: any) => resolve(e.detail), { once: true });
    }));
    await page.locator('#cpy').click();
    const detail: any = await eventDetail;
    expect(detail.text).toBe('Copied from a wb-button!');

    // Visible feedback effect: innerHTML swaps to the feedback text and the
    // wb-copy--copied class is added (copy.js's showFeedback()).
    await expect(page.locator('#cpy')).toHaveClass(/wb-copy--copied/);
    await expect(page.locator('#cpy')).toHaveText('Copied!');

    // Real clipboard effect, since permissions are granted for this origin.
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Copied from a wb-button!');
  });
});

test.describe('Native <button variant size> -- same effect-based checks apply to the plain HTML tag', () => {
  test('native <button variant="primary"> vs variant="danger"> differ in computed background-color', async ({ page }) => {
    await setup(page, `
      <button id="n-primary" variant="primary">Primary</button>
      <button id="n-danger" variant="danger">Danger</button>
    `);
    const primaryBg = await page.locator('#n-primary').evaluate(el => getComputedStyle(el).backgroundColor);
    const dangerBg = await page.locator('#n-danger').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(primaryBg).not.toBe(dangerBg);
    expect(primaryBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(dangerBg).not.toBe('rgba(0, 0, 0, 0)');

    // And confirm the JS actually applied the mapped modifier classes (the
    // `variant` ATTRIBUTE alone does nothing for a native <button> -- only
    // the wb-button--{variant} CLASS is styled; semantics/button.js's native
    // branch is responsible for adding it).
    await expect(page.locator('#n-primary')).toHaveClass(/wb-button--primary/);
    await expect(page.locator('#n-danger')).toHaveClass(/wb-button--danger/);
  });

  test('native <button variant size="sm"> vs size="lg"> differ in computed font-size and height', async ({ page }) => {
    await setup(page, `
      <button id="n-sm" variant="primary" size="sm">Small</button>
      <button id="n-lg" variant="primary" size="lg">Large</button>
    `);
    const sm = await page.locator('#n-sm').evaluate(el => {
      const cs = getComputedStyle(el);
      return { fontSize: parseFloat(cs.fontSize), height: el.getBoundingClientRect().height };
    });
    const lg = await page.locator('#n-lg').evaluate(el => {
      const cs = getComputedStyle(el);
      return { fontSize: parseFloat(cs.fontSize), height: el.getBoundingClientRect().height };
    });
    expect(lg.fontSize).toBeGreaterThan(sm.fontSize);
    expect(lg.height).toBeGreaterThan(sm.height);
    await expect(page.locator('#n-sm')).toHaveClass(/wb-button--sm/);
    await expect(page.locator('#n-lg')).toHaveClass(/wb-button--lg/);
  });
});
