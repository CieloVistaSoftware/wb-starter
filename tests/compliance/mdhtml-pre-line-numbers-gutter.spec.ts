/**
 * Reported live: on any markdown page viewed through the doc-viewer, every
 * code block's first 1-2 characters rendered hidden behind the line-number
 * gutter (e.g. "const greeting" showed as "nst greeting").
 *
 * Root cause: mdhtml.css's `.wb-mdhtml pre { padding: 1rem; }` has higher
 * specificity (class + tag) than pre.css's `.x-pre--has-line-numbers {
 * padding-left: 2.5rem; }` (single class) — it won regardless of stylesheet
 * load order, clobbering the gutter's reserved space for any pre.js-enhanced
 * <pre> that happens to render inside a <wb-mdhtml> container (every code
 * block viewed via the doc-viewer).
 *
 * Fixed with `.wb-mdhtml pre:not(.x-pre)` — once pre.js has enhanced a
 * block it manages its own complete padding via .x-pre, so mdhtml.css's
 * generic rule should never apply to it at all.
 */
import { test, expect } from '@playwright/test';
import { ROOT, readFile } from '../base';
import * as path from 'path';

test('mdhtml.css must not style pre.js-enhanced (.x-pre) code blocks', () => {
  const css = readFile(path.join(ROOT, 'src/styles/behaviors/mdhtml.css'));
  const preRuleMatch = css.match(/\.wb-mdhtml\s+pre(?!\s*code)[^{]*\{[^}]*padding[^}]*\}/);
  expect(preRuleMatch, 'expected a .wb-mdhtml pre rule setting padding').not.toBeNull();
  expect(
    preRuleMatch![0],
    'the .wb-mdhtml pre padding rule must exclude .x-pre (pre.js-enhanced blocks manage their own padding, including extra room for the line-number gutter) — otherwise its higher specificity clobbers .x-pre--has-line-numbers regardless of load order'
  ).toMatch(/\.wb-mdhtml\s+pre:not\(\.x-pre\)/);
});
