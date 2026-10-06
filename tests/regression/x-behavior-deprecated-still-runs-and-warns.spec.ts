/**
 * #1642 -- x-behavior="name" is deprecated, but old markup still works.
 *
 * John: `x-behavior="cardimage"` -- "this format is deprecated in entire
 * project". Deprecated, not removed: a page someone wrote last month with
 * `<span x-behavior="chip">` must still render its chip. What changes is that
 * the runtime now says, once per spelling, that the form is deprecated and
 * what to write instead.
 */
import { test, expect } from '../fixtures/offline';

test.use({ serviceWorkers: 'block' });

for (const engine of ['wb-lazy', 'wb'] as const) {
  test(`${engine}.js: x-behavior still applies the behavior, and warns once with the replacement`, async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('#1642')) warnings.push(m.text()); });

    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });

    const state = await page.evaluate(async (file) => {
      const host = document.createElement('div');
      host.innerHTML = [
        '<span x-behavior="chip">one</span>',
        '<span x-behavior="chip">two</span>',
        '<pre x-behavior="pre"><code>let a = 1;</code></pre>',
      ].join('');
      document.body.appendChild(host);
      const mod: any = await import(`/src/core/${file}.js`);
      await (mod.default || mod.WB).scan(host, { eager: true });
      const [chip] = host.querySelectorAll('span');
      return {
        chipBuilt: chip.classList.contains('x-chip'),
        preBuilt: host.querySelector('pre')!.classList.contains('x-pre'),
      };
    }, engine);

    expect(state.chipBuilt, 'the deprecated form must still apply the behavior').toBe(true);
    expect(state.preBuilt).toBe(true);
    // Once per spelling: two chips, one warning.
    expect(warnings.filter((w) => w.includes('<span x-behavior="chip">'))).toHaveLength(1);
    expect(warnings.join('\n')).toContain('Write <span x-chip> instead');
    // The tag already IS pre, so the replacement is no attribute at all.
    expect(warnings.join('\n')).toContain('Write <pre> instead');
  });
}

// The warning tells people to write x-{name}, so x-{name} has to work for
// every behavior x-behavior="{name}" reaches. On wb-lazy.js 46 of them (list,
// json, divider, datepicker, hotkey, ...) were reachable ONLY through
// x-behavior: <ul x-list> did nothing, silently.
//
// The four move-direction helpers are the exception, on purpose: move()
// wires them on the buttons inside its x-move container, and routing them
// too would bind each button twice (wb-lazy.js PARENT_WIRED_BEHAVIORS).
const PARENT_WIRED = ['moveup', 'movedown', 'moveleft', 'moveright'];
test('wb-lazy.js: every registered behavior runs from its own x-{name} attribute, as it does from x-behavior', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async (parentWired) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    const { listBehaviors } = await import('/src/wb-viewmodels/index.js' as any);
    const names: string[] = listBehaviors().filter((n: string) => !parentWired.includes(n));
    const ran = async (html: string) => {
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.appendChild(host);
      await WB.scan(host, { eager: true });
      const el = host.firstElementChild as HTMLElement;
      const state = el.hasAttribute('x-ready') || el.hasAttribute('x-error');
      host.remove();
      return state;
    };
    const missing: string[] = [];
    for (const name of names) {
      const legacy = await ran(`<div x-behavior="${name}"></div>`);
      const attr = await ran(`<div x-${name}></div>`);
      if (legacy && !attr) missing.push(name);
    }
    return { count: names.length, missing };
  }, PARENT_WIRED);
  expect(result.count, 'the registry read came back empty -- the check would pass vacuously').toBeGreaterThan(100);
  expect(result.missing, 'these behaviors run from x-behavior="name" but not from x-name').toEqual([]);
});
