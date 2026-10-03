import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

/**
 * #1254 -- John, on the x-avatar demos: "Make the fine lines white."
 *
 * Every avatar demo shows images/placeholder.svg. Its line art (sun circle,
 * mountain outline, frame) was grey #9ca3af at 0.5/0.35 opacity and all but
 * vanished inside a dark avatar. Every stroke in it must be white, and visible.
 */
test('placeholder.svg draws its fine lines in white, clearly visible', () => {
  const svg = readFileSync('images/placeholder.svg', 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const strokes = [...svg.matchAll(/stroke="([^"]+)"/g)].map((m) => m[1].toLowerCase());
  expect(strokes.length, 'the placeholder has line art').toBeGreaterThan(0);
  for (const s of strokes) expect(s, 'every stroke is white').toBe('#ffffff');
  const opacities = [...svg.matchAll(/stroke="[^"]+"[^>]*opacity="([\d.]+)"|opacity="([\d.]+)"[^>]*stroke=/g)]
    .map((m) => Number(m[1] ?? m[2]));
  for (const o of opacities) expect(o, 'line art is not faded out').toBeGreaterThanOrEqual(0.6);
});
