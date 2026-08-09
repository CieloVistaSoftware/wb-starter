/**
 * Shared "pristine page source" cache.
 * -----------------------------------------------------------------------------
 * Several behaviors (demo, mdhtml) need the ORIGINAL, as-authored HTML of an
 * element they're attached to — not its live innerHTML, which by the time an
 * async behavior runs may already have been mutated by WB scanning/enhancing
 * nested elements (e.g. a `<div x-gallery>` embedded inside a `<wb-mdhtml>`
 * code sample). Fetching the page's own source over the network sidesteps
 * that race entirely: it's always the pristine authored text, independent of
 * any DOM mutation that's happened since parse time.
 * -----------------------------------------------------------------------------
 */

let _pageSource = null;
let _pageSourcePromise = null;

export function getPageSource() {
  if (_pageSource) return Promise.resolve(_pageSource);
  if (_pageSourcePromise) return _pageSourcePromise;
  _pageSourcePromise = fetch(location.href).then((r) => r.text()).then((text) => {
    _pageSource = text;
    return text;
  });
  return _pageSourcePromise;
}

/** Extract the idx-th <tagName>...</tagName> block's inner content from source. */
export function extractTagBlock(source, tagName, idx) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  let i = 0;
  while ((match = regex.exec(source)) !== null) {
    if (i === idx) return match[1];
    i++;
  }
  return '';
}
