// Minimal `diff` behavior shim — lightweight and safe for CI/regression
// Purpose: satisfy registry/consumers and provide a stable, testable hook.
export default function diff(element) {
  try {
    // Mark the element as having the diff behavior applied so tests can assert
    if (element) element.setAttribute('x-diff-init', '1');

    // Non-destructive: attempt a simple DOM hydration if content present
    const before = element.querySelector('.diff-before');
    const after = element.querySelector('.diff-after');
    if (before && after) {
      const wrapper = document.createElement('div');
      wrapper.className = 'wb-diff--rendered';
      wrapper.appendChild(before.cloneNode(true));
      wrapper.appendChild(after.cloneNode(true));
      element.appendChild(wrapper);
    }
  } catch (err) {
    try { if (element) element.setAttribute('x-error', 'diff-behavior-failed'); } catch (e) { /* best-effort */ }
  }

  // Return teardown function for runtime compatibility
  return () => {
    try { if (element) element.removeAttribute('x-diff-init'); } catch (e) { /* noop */ }
  };
}
