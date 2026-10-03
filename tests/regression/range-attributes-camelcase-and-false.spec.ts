import { test, expect } from '../fixtures/offline';

/**
 * #1140 -- the range behavior's four attributes, every way they can be written.
 *
 *   names    camelCase (showValue), the no-dash rule (#1125); the old dashed
 *            spelling (show-value) must keep working so existing markup is not
 *            broken by the rename
 *   flags    bare / "true" -> on; "false" / "0" -> OFF (hasAttribute() turned
 *            the display on for any value at all, "false" included)
 *   hosts    <input type="range"> (the native host, auto-injected) and
 *            <div x-range> (builds its own slider)
 *
 * The oracle: a value display is an <output class="x-range-value">; labels are
 * a .x-range-labels row; the display text is prefix + value + suffix.
 */

type Case = { name: string; attrs: string; output: boolean; labels: boolean; text?: string };

const FLAG_CASES: Case[] = [];
for (const [spelling, value, on] of [
  ['showValue', '', true], ['showValue', '="true"', true], ['showValue', '="false"', false], ['showValue', '="0"', false],
  ['show-value', '', true], ['show-value', '="false"', false],
] as const) {
  FLAG_CASES.push({ name: `${spelling}${value || ' (bare)'}`, attrs: `${spelling}${value}`, output: on, labels: false });
}
for (const [spelling, value, on] of [
  ['showLabels', '', true], ['showLabels', '="false"', false], ['show-labels', '', true],
] as const) {
  FLAG_CASES.push({ name: `${spelling}${value || ' (bare)'}`, attrs: `${spelling}${value}`, output: false, labels: on });
}
FLAG_CASES.push({ name: 'no attributes', attrs: '', output: false, labels: false });

const TEXT_CASES: Case[] = [
  { name: 'valuePrefix + valueSuffix', attrs: 'showValue valuePrefix="$" valueSuffix=" USD"', output: true, labels: false, text: '$40 USD' },
  { name: 'legacy value-prefix / value-suffix', attrs: 'show-value value-prefix="~" value-suffix="%"', output: true, labels: false, text: '~40%' },
];

const HOSTS = {
  'input host': (a: string) => `<input type="range" min="0" max="100" value="40" ${a}>`,
  'div x-range host': (a: string) => `<div x-range min="0" max="100" value="40" ${a}></div>`,
};

for (const [hostName, markup] of Object.entries(HOSTS)) {
  for (const c of [...FLAG_CASES, ...TEXT_CASES]) {
    test(`${hostName}: ${c.name}`, async ({ page }) => {
      await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
      const r = await page.evaluate(async (html) => {
        const host = document.createElement('div');
        host.innerHTML = html;
        document.body.appendChild(host);
        const mod: any = await import('/src/core/wb-lazy.js');
        await (mod.default || mod.WB).scan(host, { eager: true });
        const out = host.querySelector('output.x-range-value');
        return { output: !!out, labels: !!host.querySelector('.x-range-labels'), text: out ? out.textContent : null };
      }, markup(c.attrs));
      expect(r.output, 'value display present').toBe(c.output);
      expect(r.labels, 'min/max labels present').toBe(c.labels);
      if (c.text) expect(r.text).toBe(c.text);
    });
  }
}
