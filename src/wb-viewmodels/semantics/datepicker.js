// Minimal datepicker shim for registry completeness and basic testability
export function datepicker(element) {
  try {
    if (element) element.setAttribute('x-datepicker-init', '1');
    // Provide a basic API surface used by tests
    element.addEventListener('focus', () => {
      element.setAttribute('data-open', 'true');
    });
  } catch (err) {
    try { if (element) element.setAttribute('x-error', 'datepicker-failed'); } catch (e) {}
  }
  return () => { try { element.removeAttribute('data-open'); element.removeAttribute('x-datepicker-init'); } catch(e){} };
}
