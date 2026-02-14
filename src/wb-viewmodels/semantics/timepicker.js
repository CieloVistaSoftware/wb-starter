// Minimal timepicker shim
export function timepicker(element) {
  try {
    if (element) element.setAttribute('x-timepicker-init', '1');
    element.addEventListener('focus', () => element.setAttribute('data-open', 'true'));
  } catch (err) {
    try { if (element) element.setAttribute('x-error', 'timepicker-failed'); } catch (e) {}
  }
  return () => { try { element.removeAttribute('data-open'); element.removeAttribute('x-timepicker-init'); } catch(e){} };
}
