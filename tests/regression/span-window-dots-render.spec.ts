import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1464: span's red/yellow/green/dot variants are window-control dots. Their
 * look hung off a second class (x-window-dot, site.css, literal colours), so
 * the schema's x-span--<variant> named classes nothing styled, and "dot" got a
 * size but no colour at all -- an invisible dot.
 *
 * Each must render as a visible round dot, coloured by its theme token.
 */
test('span window-dot variants render as visible, coloured dots (#1464)', async ({ page }) => {
  await injectAndScan(page, [
    '<p>',
    '<span x-span variant="red" id="dotRed"></span>',
    '<span x-span variant="yellow" id="dotYellow"></span>',
    '<span x-span variant="green" id="dotGreen"></span>',
    '<span x-span variant="dot" id="dotPlain"></span>',
    '</p>',
  ].join(''));

  const dots = await page.evaluate(() => {
    const token = (name: string) => {
      const probe = document.createElement('i');
      probe.style.color = `var(${name})`;
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    return ['dotRed', 'dotYellow', 'dotGreen', 'dotPlain'].map((id) => {
      const el = document.getElementById(id)!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        id,
        width: Math.round(r.width),
        height: Math.round(r.height),
        round: cs.borderRadius === '50%',
        background: cs.backgroundColor,
        expected: id === 'dotPlain' ? cs.color
          : token(`--window-dot-${id.slice(3).toLowerCase()}`),
        classes: el.className,
      };
    });
  });

  for (const d of dots) {
    expect(d.width, `${d.id} must have a width (${d.classes})`).toBeGreaterThan(5);
    expect(d.height, `${d.id} must have a height`).toBe(d.width);
    expect(d.round, `${d.id} must be round`).toBe(true);
    expect(d.background, `${d.id} must not be transparent`).not.toBe('rgba(0, 0, 0, 0)');
    expect(d.background, `${d.id} must be its own colour`).toBe(d.expected);
  }
});
