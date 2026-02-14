// Minimal autosize modifier (adjusts textarea height)
export default function autosize(el) {
  try {
    const t = el.tagName === 'TEXTAREA' ? el : el.querySelector('textarea');
    if (!t) return () => {};
    const resize = () => {
      t.style.height = 'auto';
      t.style.height = (t.scrollHeight) + 'px';
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
