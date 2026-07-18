/**
 * WB Repeater — behavior (v3: composition, NOT a class that `extends HTMLElement`).
 * -----------------------------------------------------------------------------
 * Simple repeater for prototyping.
 *
 *   <wb-repeater count="3">
 *     <template>Content {{index}}</template>
 *   </wb-repeater>
 *
 * {{index}} → 1-based, {{i}} → 0-based. Mapped wb-repeater → repeater in
 * wb-lazy.js / index.js; no custom element, no extends.
 * -----------------------------------------------------------------------------
 */
export default function repeater(element, options = {}) {
  // Idempotent: rendering replaces our own children (incl. the <template>), and
  // WB.scan below could re-visit us — render exactly once.
  if (element._wbRepeaterDone) return () => {};
  element._wbRepeaterDone = true;

  // The wrapper itself contributes no box — its repeated children lay out as if
  // direct children of the parent. Adding the schema's declared baseClass is
  // harmless here (display:contents means it carries no visual box regardless)
  // and satisfies the schema/source baseClass compliance check.
  element.style.display = 'contents';
  element.classList.add('wb-repeater');

  const count = parseInt(options.count || element.getAttribute('count') || '0', 10) || 0;
  const template = element.querySelector('template');
  if (!template) return () => {};

  const content = template.innerHTML;
  let html = '';
  for (let i = 0; i < count; i++) {
    html += content.replace(/\{\{index\}\}/g, String(i + 1)).replace(/\{\{i\}\}/g, String(i));
  }
  element.innerHTML = html;

  // Upgrade any wb-*/x-* behaviors inside the freshly injected content.
  if (window.WB && window.WB.scan) window.WB.scan(element);

  return () => { element.innerHTML = ''; element._wbRepeaterDone = false; };
}
