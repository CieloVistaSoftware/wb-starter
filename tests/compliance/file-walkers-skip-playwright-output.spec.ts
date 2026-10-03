import { test, expect } from '@playwright/test';
import { getFiles, isExcludedDir } from '../base';

/**
 * #1158: the CSS rule checks walked into data/playwright-output/, where a
 * Playwright trace stores copies of the site's own stylesheets, and failed on
 * them (29 "offending" files instead of 5, 885 !important instead of <130).
 * The bare '.playwright-artifacts' exclusion never matched Playwright's real
 * per-worker folder names (.playwright-artifacts-7, -8, ...).
 */
test('Playwright scratch folders are never walked', () => {
  expect(isExcludedDir('playwright-output')).toBe(true);
  expect(isExcludedDir('.playwright-artifacts-7')).toBe(true);
  expect(isExcludedDir('.playwright-artifacts-12')).toBe(true);
  expect(isExcludedDir('styles')).toBe(false);
  const css = getFiles('.', ['.css']).map((f) => f.split('\\').join('/'));
  expect(css.filter((f) => f.includes('playwright-output') || f.includes('.playwright-artifacts'))).toEqual([]);
  expect(css.some((f) => f.includes('src/styles/')), 'real stylesheets are still found').toBe(true);
});
