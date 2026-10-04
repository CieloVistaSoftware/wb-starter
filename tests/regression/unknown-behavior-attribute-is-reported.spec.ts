import { test, expect } from '@playwright/test';

/**
 * An x-* attribute that names no behavior is reported, and a real one is not (#1101).
 *
 * Before 3c2eb8f5, `<div x-carfile>` (a typo for x-cardfile) matched no selector,
 * so no code path ran: no decoration, no x-error, no console output, nothing in
 * data/errors.json. reportUnknownBehaviorAttributes() in src/core/wb-lazy.js now
 * sweeps every scan. Until this spec, no test asserted it: deleting the reporter
 * left every test green.
 *
 * The cases are GENERATED from the runtime's own registries, not hand-picked:
 *   known   = every key of extensionMap, WB_LAZY_ONLY_ATTRIBUTES and
 *             behaviorModules (as x-<name>) -- all three, because checking fewer
 *             is the incomplete-registry mistake the reporter's comments record
 *   unknown = each known name with one letter removed, kept only if the result
 *             names nothing (x-cardfile -> x-cardfil, ...)
 *   control = the flags and state markers the issue says must never be flagged
 * Oracle:
 *   unknown -> x-unknown-behavior="<name>" on the element, and exactly one
 *              Events.error naming it, even after a second scan
 *   known / control -> no marker, no error
 *
 * The container is `hidden`, so the lazy observer never injects anything.
 * That tests the reporter over every registered name without booting ~200
 * behaviors on bare spans. Events.error is recorded in the page, and the
 * error-log POST is swallowed, so data/errors.json stays empty
 * (compliance/error-log-empty.spec.ts).
 */

// #1349: the error-log route is a POST and sw.js only claims GETs, so the
// swallow below did work and data/errors.json stayed empty. Blocked anyway —
// this spec imports the runtime's three registries out of the live page, and
// a module served from the worker's cache is not necessarily the module in the
// tree under test.
test.use({ serviceWorkers: 'block' });

const CONTROL = [
  'x-eager', 'x-ignore', 'x-error', 'x-ready', 'x-schema',
  'x-hydrated', 'x-docs', 'x-teaching-example', 'x-autosize-init', 'x-',
];

type Row = { name: string; marker: string | null; errors: number };

test.describe('#1101: an x-* attribute that names no behavior does not fail silently', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/error-log/append', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => {
      const WB = (window as any).WB;
      return WB?.scan && WB?.ready instanceof Promise;
    }, { timeout: 20000 });
    await page.evaluate(() => (window as any).WB.ready);
  });

  test('every generated case, scanned twice, is flagged exactly when it names nothing', async ({ page }) => {
    const result = await page.evaluate(async (control: string[]) => {
      const { extensionMap } = await import('/src/core/tag-map.js');
      const { WB_LAZY_ONLY_ATTRIBUTES } = await import('/src/core/wb-lazy.js');
      const { behaviorModules } = await import('/src/wb-viewmodels/index.js');
      const { Events } = await import('/src/core/events.js');

      const known = new Set<string>([
        ...Object.keys(extensionMap),
        ...Object.keys(WB_LAZY_ONLY_ATTRIBUTES),
        ...Object.keys(behaviorModules).map((n) => `x-${n}`),
      ].filter((n) => /^x-[a-z0-9-]+$/.test(n)));

      const unknown = new Set<string>();
      for (const name of known) {
        const body = name.slice(2);
        if (body.length < 3) continue;
        const typo = `x-${body.slice(0, -1)}`;
        if (!known.has(typo) && !control.includes(typo) && !/-init$/.test(typo)) unknown.add(typo);
      }

      const calls: string[] = [];
      const original = Events.error;
      Events.error = (message: string, ...rest: unknown[]) => {
        calls.push(String(message));
        return original.call(Events, message, ...rest);
      };

      const host = document.createElement('div');
      host.hidden = true;
      // Kind is kept beside the element, not on it: no data- attributes on
      // x-* elements (Tier-1 Law 11).
      const cases: { el: HTMLElement; kind: string; name: string }[] = [];
      const add = (kind: string, name: string) => {
        const el = document.createElement('span');
        el.setAttribute(name, '');
        cases.push({ el, kind, name });
        host.appendChild(el);
      };
      known.forEach((n) => add('known', n));
      unknown.forEach((n) => add('unknown', n));
      control.forEach((n) => add('control', n));
      document.body.appendChild(host);

      const WB = (window as any).WB;
      await WB.scan(host);
      await WB.scan(host);

      Events.error = original;

      const rows: Record<string, Row[]> = { known: [], unknown: [], control: [] };
      for (const { el, kind, name } of cases) {
        const needle = `unknown behavior "${name}"`;
        rows[kind].push({
          name,
          marker: el.getAttribute('x-unknown-behavior'),
          errors: calls.filter((c) => c.includes(needle)).length,
        });
      }
      host.remove();
      return { rows, totalCalls: calls.length };
    }, CONTROL);

    const { known, unknown, control } = result.rows;

    // The generator must actually produce cases, or every assertion below is vacuous.
    expect(known.length, 'known behavior attributes drawn from the three registries').toBeGreaterThan(100);
    expect(unknown.length, 'typo cases generated from them').toBeGreaterThan(50);
    expect(control.length).toBe(CONTROL.length);

    const missed = unknown.filter((r) => r.marker !== r.name || r.errors !== 1);
    expect(missed, 'every typo gets x-unknown-behavior naming it and exactly one error across two scans').toEqual([]);

    const falseAlarms = [...known, ...control].filter((r) => r.marker !== null || r.errors !== 0);
    expect(falseAlarms, 'no real behavior, control flag or state marker is reported').toEqual([]);

    expect(result.totalCalls, 'the only errors raised are the typo reports').toBe(unknown.length);
  });

  test('an element carrying a real behavior and a typo is flagged for the typo only', async ({ page }) => {
    const out = await page.evaluate(async () => {
      const { Events } = await import('/src/core/events.js');
      const calls: string[] = [];
      const original = Events.error;
      Events.error = (message: string, ...rest: unknown[]) => {
        calls.push(String(message));
        return original.call(Events, message, ...rest);
      };

      const host = document.createElement('div');
      host.hidden = true;
      host.innerHTML = '<div id="mixed" x-cardfile x-carfile filename="a.pdf"></div>';
      document.body.appendChild(host);
      await (window as any).WB.scan(host);
      Events.error = original;

      const el = document.getElementById('mixed')!;
      const result = { marker: el.getAttribute('x-unknown-behavior'), calls };
      host.remove();
      return result;
    });

    expect(out.marker).toBe('x-carfile');
    expect(out.calls.filter((c) => c.includes('"x-carfile"'))).toHaveLength(1);
    expect(out.calls.filter((c) => c.includes('"x-cardfile"'))).toHaveLength(0);
  });
});
