/**
 * x-behavior="name" is deprecated (#1642).
 *
 * John, 2026-10-06: `x-behavior="cardimage"` -- "this format is deprecated in
 * entire project". One behavior has one spelling: `<article x-cardimage>`. And
 * where the tag already IS the behavior (`<pre>`, `<code>`, `<input>`, ...,
 * tag-map.js's nativeMap), no attribute at all: `<pre x-behavior="pre">` says
 * the same thing twice (#967).
 *
 * Old markup keeps working -- wb.js and wb-lazy.js still dispatch it -- but it
 * says so, once per spelling, and names the replacement, so whoever wrote it
 * can find it and fix it. console.warn rather than logError(): this is advice
 * about markup that still runs, not a failure, and the Error Log is for things
 * that went wrong.
 */
import { getNativeBehavior } from './tag-map.js';

/** Spellings already reported, so a page with 40 of the same one warns once. */
const warned = new Set();

/**
 * The markup that replaces `x-behavior="..."` on this element.
 *
 * @param {Element} element host carrying x-behavior
 * @returns {string} e.g. `<article x-cardimage>`, or `<pre>` when the tag already is it
 */
export function xBehaviorReplacement(element) {
  const tag = element.tagName.toLowerCase();
  const native = getNativeBehavior(element);
  const names = (element.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean);
  const attrs = names.filter((name) => name !== native).map((name) => ` x-${name}`).join('');
  return `<${tag}${attrs}>`;
}

/**
 * Warn, once per spelling, that this element uses the deprecated
 * `x-behavior="..."` form.
 *
 * @param {Element} element host carrying x-behavior
 * @returns {boolean} true when this call printed the warning
 */
export function warnXBehaviorDeprecated(element) {
  const value = (element.getAttribute('x-behavior') || '').trim();
  if (!value) return false;
  const tag = element.tagName.toLowerCase();
  const key = `${tag}|${value}`;
  if (warned.has(key)) return false;
  warned.add(key);
  console.warn(
    `[WB] <${tag} x-behavior="${value}"> is deprecated (#1642). ` +
    `Write ${xBehaviorReplacement(element)} instead -- it still runs for now.`
  );
  return true;
}
