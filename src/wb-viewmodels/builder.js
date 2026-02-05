/**
 * Visual page builder component behavior.
 * - `<wb-builder>` component with theme and variant support.
 */
export function cc() {}

export function builder(element) {
  console.log('🏗️ BUILDER BEHAVIOR CALLED', element);
  
  const label = element.dataset.label || 'Builder';
  const icon = element.dataset.icon || '🎨';
  const theme = element.dataset.theme || 'default';
  
  console.log('🏗️ Builder config:', { label, icon, theme });
  
  // Apply base class
  element.classList.add('wb-builder');
  element.classList.add('wb-builder-component');

  // Theme class (using theme already declared above)
  if (theme) {
    element.classList.add(`wb-builder--theme-${theme}`);
  }

  // Variant class
  const variant = element.dataset.variant;
  if (variant) {
    element.classList.add(`wb-builder--variant-${variant}`);
  }

  // Clickable
  if (element.hasAttribute('data-clickable')) {
    element.classList.add('wb-builder--clickable');
  }

  // Hoverable
  if (element.dataset.hoverable === 'true') {
    element.classList.add('wb-builder--hoverable');
  } else if (element.dataset.hoverable === 'false') {
    element.classList.remove('wb-builder--hoverable');
  }

  // Elevated
  if (element.hasAttribute('data-elevated')) {
    element.classList.add('wb-builder--elevated');
  }

  // Draggable
  if (element.dataset.draggable !== 'false') {
    element.classList.add('wb-builder--draggable');
  }

  // Configurable
  if (element.dataset.configurable !== 'false') {
    element.classList.add('wb-builder--configurable');
  }

  // Apply inline styles
  Object.assign(element.style, {
    border: '1px solid var(--border-color, #374151)',
    borderRadius: 'var(--radius-lg, 8px)',
    background: 'var(--bg-secondary, #1f2937)',
    padding: '1rem',
    transition: 'all 0.2s ease',
    overflow: 'hidden'
  });
  
  // Render builder UI if empty
  console.log('🏗️ Element innerHTML empty?', !element.innerHTML.trim());
  if (!element.innerHTML.trim()) {
    console.log('🏗️ Injecting builder UI');
    element.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
        <h3 style="margin-bottom: 0.5rem;">${label}</h3>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">Builder component</p>
      </div>
    `;
    console.log('✅ Builder UI injected');
  } else {
    console.log('⏭️ Skipping UI injection, element not empty');
  }
  
  return () => {
    // Cleanup if needed
  };
}
