import { setRule } from '../core/dynamic-style.js';
// Minimal autosize modifier (adjusts textarea height)
export default function autosize(el) {
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
  } catch (err) {
    try { if (el) el.setAttribute('x-error', 'autosize-failed'); } catch (e) {}
    return () => {};
  }
}
