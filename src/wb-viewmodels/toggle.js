/**
 * Toggle Behavior
 * -----------------------------------------------------------------------------
 * Toggle a class or state with IMMEDIATE visual feedback on mousedown
 * 
 * Helper Attribute: [x-toggle]
 * -----------------------------------------------------------------------------
 */
export function toggle(element, options = {}) {
  const config = {
    // Support both data-class/data-toggle-class for flexibility
    class: options.class || element.dataset.class || element.dataset.toggleClass || 'active',
    // Support both data-target/data-toggle-target for flexibility
    target: options.target || element.dataset.target || element.dataset.toggleTarget,
    self: options.self ?? (element.dataset.toggleSelf !== 'false'),
    ...options
  };

  element.classList.add('wb-toggle');
  element.style.cursor = 'pointer';
  element.style.userSelect = 'none';
  element.style.transition = 'all 0.1s ease';

  const getTargets = () => {
    const targets = [];
    if (config.self) targets.push(element);
    if (config.target) {
      targets.push(...document.querySelectorAll(config.target));
    }
    return targets;
  };

  const classes = config.class.split(/\s+/);

  // IMMEDIATE color change on mousedown (before release)
  const onMouseDown = (e) => {
    e.preventDefault();
    // Use a different variable name to avoid duplicate declaration
    const toggleTargets = getTargets();
    toggleTargets.forEach(target => {
      classes.forEach(cls => target.classList.toggle(cls));
    });

    const isActive = element.classList.contains(classes[0]);
    element.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    // Immediate visual feedback
    if (isActive) {
      element.style.background = 'var(--primary, #6366f1)';
      element.style.color = 'white';
      element.style.borderColor = 'var(--primary, #6366f1)';
      element.style.transform = 'scale(0.97)';
    } else {
      element.style.background = '';
      element.style.color = '';
      element.style.borderColor = '';
      element.style.transform = 'scale(0.97)';
    }

    element.dispatchEvent(new CustomEvent('wb:toggle', {
      bubbles: true,
      detail: { active: isActive, targets: toggleTargets, class: config.class }
    }));
  };

  const onMouseUp = () => {
    element.style.transform = '';
  };

  element.addEventListener('mousedown', onMouseDown);
  element.addEventListener('mouseup', onMouseUp);
  element.addEventListener('mouseleave', onMouseUp);
  element.addEventListener('touchstart', onMouseDown, { passive: false });
  element.addEventListener('touchend', onMouseUp);
  
  // ARIA & keyboard
  element.setAttribute('role', 'button');
  element.setAttribute('aria-pressed', 'false');
  if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
    element.setAttribute('tabindex', '0');
  }

  const onKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMouseDown(e);
      setTimeout(onMouseUp, 150);
    }
  };
  element.addEventListener('keydown', onKeydown);

  element.wbToggle = {
    toggle: () => { onMouseDown(new Event('click')); setTimeout(onMouseUp, 150); },
    isActive: () => element.classList.contains(classes[0])
  };

  element.classList.add('wb-ready');

  return () => {
    element.classList.remove('wb-toggle', ...classes);
    element.style.background = '';
    element.style.color = '';
    element.style.borderColor = '';
    element.style.transform = '';
    element.removeAttribute('role');
    element.removeAttribute('aria-pressed');
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
    element.removeEventListener('mouseleave', onMouseUp);
    element.removeEventListener('touchstart', onMouseDown);
    element.removeEventListener('touchend', onMouseUp);
    element.removeEventListener('keydown', onKeydown);
    delete element.wbToggle;
  };
}

export default toggle;
