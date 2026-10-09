/**
 * The registry audit's "computed route" is real: every behavior it says is
 * reachable only through [x-{name}] does inject from <div x-NAME> (#831).
 *
 * Until #831's audit modelled wb-lazy.js's unroutedBehaviorAttributes()
 * (#1642), it reported 60 behaviors as UNREACHABLE. 45 of them have a module
 * and no table entry, and the runtime computes their selector from index.js.
 * The audit now calls those reachable, and this is the evidence: the list
 * comes from the audit itself (`--json`, `computedOnly`), and each name is
 * scanned on both engines from bare markup. If the audit's model drifts from
 * the runtime, a name it calls reachable stops injecting and fails here.
 */
import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

test.use({ serviceWorkers: 'block' });

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const audit = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, 'scripts/audit-behavior-registry.mjs'), '--json'], { encoding: 'utf8' }));
const COMPUTED_ONLY: string[] = audit.computedOnly;

for (const engine of ['wb-lazy', 'wb'] as const) {
  test(`${engine}.js: every behavior the audit reaches only by the computed route injects from <div x-NAME>`, async ({ page }) => {
    test.setTimeout(120_000);
    expect(COMPUTED_ONLY.length, 'the audit listed nothing -- this would pass vacuously').toBeGreaterThan(40);

    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async ({ file, names }) => {
      document.documentElement.setAttribute('data-x-expected-errors', '');
      const mod: any = await import(`/src/core/${file}.js`);
      const WB = mod.default || mod.WB;
      const notReady: Record<string, string> = {};
      for (const name of names) {
        const host = document.createElement('div');
        host.innerHTML = `<div x-${name}></div>`;
        document.body.appendChild(host);
        await WB.scan(host, { eager: true });
        const el = host.firstElementChild as HTMLElement;
        if (!el.hasAttribute('x-ready')) notReady[name] = el.getAttribute('x-error') ?? 'no x-ready, no x-error';
        host.remove();
      }
      return notReady;
    }, { file: engine, names: COMPUTED_ONLY });

    expect(result, 'the audit calls these reachable, but <div x-NAME> did not inject').toEqual({});
  });
}
