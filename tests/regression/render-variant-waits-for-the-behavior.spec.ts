import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { openBehaviorsPanel, renderVariant, example } from '../utils/behaviors-panel';

/**
 * #1457: renderVariant() picked a variant row, waited for "any child" in the
 * live panel, then slept 250ms. Nothing waited for the behavior to APPLY, so
 * on a starved CI runner (the trace shows one 250ms sleep taking 3.7s) the
 * variant specs measured raw, unstyled markup -- x-alert info/success/warning
 * read as the same bare <div>, and alerts-variants reported 2 distinct
 * appearances instead of 4.
 *
 * The CI condition could not be reproduced locally (a held module, a late
 * IntersectionObserver, 10x CPU throttle and a late MutationObserver all
 * applied in time), so the guard is two-part:
 *   1. the helper's contract, checked structurally: no fixed sleep, and it
 *      waits for the NEWLY picked root to carry x-ready -- red on main;
 *   2. the contract, checked live: every variant it hands back is applied,
 *      with WB's MutationObserver deliveries made 1.5s late.
 */
const HELPER = path.join(process.cwd(), 'tests', 'utils', 'behaviors-panel.ts');

test('renderVariant() waits for the picked example to apply, not for a clock (#1457)', () => {
  const src = fs.readFileSync(HELPER, 'utf8');
  const body = src.slice(src.indexOf('export async function renderVariant'), src.indexOf('export function example'));
  expect(body.length, 'renderVariant() is where it was').toBeGreaterThan(100);
  expect(body, 'a fixed sleep measures a starved runner\'s raw markup').not.toMatch(/waitForTimeout\(/);
  expect(body, 'it must wait for the example root to be applied').toMatch(/x-ready/);
  expect(body, 'and must not accept the previous variant\'s root').toMatch(/__rvPrevious/);
});

test('every variant renderVariant() hands back is applied (#1457)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    // A late observer, not a broken one: the same records, delivered 1.5s later.
    const Native = window.MutationObserver;
    (window as any).MutationObserver = class extends Native {
      constructor(cb: MutationCallback) {
        super((records, obs) => { setTimeout(() => cb(records, obs), 1500); });
      }
    };
  });
  await openBehaviorsPanel(page, 'x-alert');

  const raw: string[] = [];
  for (const variant of ['success', 'warning', 'error', 'info']) {
    await renderVariant(page, 'x-alert', variant);
    // Read at once -- no retrying expect -- because that is what every caller
    // of renderVariant() does: it measures the moment the helper returns.
    const state = await example(page).evaluate((el) => ({
      id: el.id, ready: el.hasAttribute('x-ready'), cls: el.className,
    }));
    if (state.id !== `alert-${variant}` || !state.ready || !new RegExp(`\\bx-alert--${variant}\\b`).test(state.cls)) {
      raw.push(`${variant}: id=${state.id} ready=${state.ready} class="${state.cls}"`);
    }
  }
  expect(raw, 'renderVariant() returned before the example was applied').toEqual([]);
});
