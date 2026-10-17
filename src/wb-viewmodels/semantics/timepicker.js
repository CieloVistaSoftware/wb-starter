// Minimal timepicker shim
export function timepicker(element) {
  try {
    if (element) element.setAttribute('x-timepicker-init', '1');
    element.addEventListener('focus', () => element.setAttribute('data-open', 'true'));
  } catch {
    try { if (element) element.setAttribute('x-error', 'timepicker-failed'); } catch {}
  }
  return () => { try { element.removeAttribute('data-open'); element.removeAttribute('x-timepicker-init'); } catch{} };
}
