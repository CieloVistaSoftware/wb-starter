import { test, expect } from '@playwright/test';

/**
 * #489 (split off #322): <div x-switch> never rendered at all on wb-lazy.js
 * pages -- every standalone demo page, the doc-viewer, test-harness.html --
 * because its schema was never built. switchInput() (src/wb-viewmodels/
 * semantics/switch.js) looks for a pre-built <input> via
 * `host.querySelector('input')`; that input only exists once schema-builder.js
 * constructs the host's internal structure from switch.schema.json's $view.
 * On wb.js (the main SPA runtime) WB.scan()/WB.processSchema() does that
 * before dispatching behaviors; wb-lazy.js had no equivalent call anywhere,
 * so x-schema was never set and switchInput() silently fell back to a
 * same-looking-but-unmarked self-built structure (or, when several
 * <div x-switch> shared a page, a schema-vs-behavior race meant only the FIRST
 * one on the page even got that far -- see the race-condition assertion
 * below).
 *
 * This guards the actual schema pipeline, not just the visible DOM shape:
 * switchInput()'s self-build fallback (#279) already produces a
 * visually-similar input/track/thumb structure even with no schema at all,
 * so asserting on `.x-switch__track` alone (as switch-size-variant-no-op.spec.ts
 * does) would NOT have caught this bug. `x-schema="switch"` is the one
 * signal that only appears once schema-builder.js has actually run.
 */
const HARNESS = '/demos/test-harness.html';

async function injectAndScan(page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
    return Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
  }, html);
  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every((id) => document.getElementById(id)?.hasAttribute('x-schema')),
    ids,
    { timeout: 5000 }
  );
  return ids;
}

test.describe('x-switch schema builds on wb-lazy.js pages (#489)', () => {
  test('a single <div x-switch> gets x-schema and a real schema-built checkbox input', async ({ page }) => {
    await injectAndScan(page, '<div x-switch id="sw1" label="Notifications"></div>');

    const host = page.locator('#sw1');
    await expect(host).toHaveAttribute('x-schema', 'switch');

    const input = host.locator('input[type="checkbox"]');
    await expect(input).toHaveCount(1);
    await expect(host.locator('.x-switch__track')).toHaveCount(1);
    await expect(host.locator('.x-switch__thumb')).toHaveCount(1);

    // Schema-builder clears the host's original slot content (the schema's
    // $view owns the DOM once built) -- no leftover raw text alongside the
    // real control.
    const strayText = await host.evaluate((el) =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join('')
    );
    expect(strayText).toBe('');

    // label-end span comes from switch.schema.json's $view, proving the
    // schema (not switchInput()'s manual "ensure label shown" fallback) built it.
    await expect(host.locator('.x-switch__label-end')).toHaveText('Notifications');
  });

  test('multiple <div x-switch> instances on one page all get schema-built (no first-wins race)', async ({ page }) => {
    const ids = await injectAndScan(
      page,
      `
      <div x-switch id="sw-a" label="A"></div>
      <div x-switch id="sw-b" label="B" size="lg"></div>
      <div x-switch id="sw-c" label="C" variant="primary"></div>
      <div x-switch id="sw-d" label="D" checked></div>
      <div x-switch id="sw-e" label="E" disabled></div>
      `
    );
    expect(ids.length).toBe(5);

    for (const id of ids) {
      const host = page.locator(`#${id}`);
      await expect(host, `#${id} should have x-schema set`).toHaveAttribute('x-schema', 'switch');
      await expect(host.locator('input[type="checkbox"]'), `#${id} should have a real checkbox input`).toHaveCount(1);
    }

    // size/variant classes come from switch.schema.json's own
    // appliesClass rule (applied by schema-builder.js), independent of
    // switchInput()'s own redundant manual class-adding fallback.
    await expect(page.locator('#sw-b')).toHaveClass(/x-switch--lg/);
    await expect(page.locator('#sw-c')).toHaveClass(/x-switch--primary/);
  });
});
