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
    if (t.dataset) t.dataset.wbAutosize = '1';
    return () => t.removeEventListener('input', resize);
  } catch (err) {
    try { if (el && el.dataset) el.dataset.wbError = 'autosize-failed'; } catch (e) {}
    return () => {};
  }
}
