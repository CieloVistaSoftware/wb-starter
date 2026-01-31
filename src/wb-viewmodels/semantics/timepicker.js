// Minimal timepicker shim
export function timepicker(element) {
  try {
    if (element && element.dataset) element.dataset.wbTimepicker = '1';
    element.addEventListener('focus', () => element.setAttribute('data-open', 'true'));
  } catch (err) {
    try { if (element && element.dataset) element.dataset.wbError = 'timepicker-failed'; } catch (e) {}
  }
  return () => { try { element.removeAttribute('data-open'); delete element.dataset.wbTimepicker; } catch(e){} };
}
