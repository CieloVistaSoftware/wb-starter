import { setRule } from '../core/dynamic-style.js';
// Minimal autosize modifier (adjusts textarea height)
// Deprecated: <textarea autosize> does this already (semantics/textarea.js) and
// also honors maxRows. x-autosize keeps working so no page breaks, and says so
// once per page.
let deprecationWarned = false;

export default function autosize(el) {
  if (!deprecationWarned) {
    deprecationWarned = true;
    console.warn('[x-autosize] is deprecated -- use <textarea autosize> instead. Every textarea already grows with that attribute, and it also honors maxRows.');
  }
  try {
    const t = el.tagName === 'TEXTAREA' ? el : el.querySelector('textarea');
    if (!t) return () => {};
    // Measured height through a generated rule, not the style attribute
    // (#779). Same 'autosize' slot textarea.js's own autosize uses, so the two
    // replace each other's value exactly as their style.height writes did.
    const resize = () => {
      setRule(t, 'autosize', { height: 'auto' });
      setRule(t, 'autosize', { height: `${t.scrollHeight}px` });
    };
    resize();
    t.addEventListener('input', resize);
    if (t) t.setAttribute('x-autosize-init', '1');
    return () => t.removeEventListener('input', resize);
  } catch {
    try { if (el) el.setAttribute('x-error', 'autosize-failed'); } catch {}
    return () => {};
  }
}
