/**
 * Rating Behavior
 * ===============
 * 
 * Interactive star rating component with optional background colors.
 * 
 * ATTRIBUTES:
 * - max / max: Number of stars (default: 5)
 * - value / value: Initial value (default: 0)
 * - data-readonly: If "true", user cannot change value
 * - color / color: Color of filled stars (default: gold)
 * - icon / icon: Custom icon (emoji or unicode)
 * - bg / bg: Background style (none, light, dark, primary)
 * 
 * EVENTS:
 * - wb:rating:change: Dispatched when value changes. detail: { value: number }
 * Helper Attribute: [x-behavior="rating"]
 */

export function rating(element, options = {}) {
  const config = {
    max: parseInt(options.max || element.getAttribute('max') || element.dataset.max || '5', 10),
    value: parseInt(options.value || element.getAttribute('value') || element.dataset.value || '0', 10),
    readonly: options.readonly ?? (element.dataset.readonly === 'true' || element.hasAttribute('readonly')),
    color: options.color || element.getAttribute('color') || element.dataset.color || '#fbbf24', // gold-400
    icon: options.icon || element.getAttribute('icon') || element.dataset.icon || '★',
    bg: options.bg || element.getAttribute('bg') || element.dataset.bg || 'none',
    ...options
  };

  // Background styles
  const bgStyles = {
    none: '',
    light: 'background: rgba(255,255,255,0.1); padding: 0.5rem 0.75rem; border-radius: 8px;',
    dark: 'background: rgba(0,0,0,0.2); padding: 0.5rem 0.75rem; border-radius: 8px;',
    primary: 'background: var(--primary, #6366f1); padding: 0.5rem 0.75rem; border-radius: 8px;',
    success: 'background: #22c55e; padding: 0.5rem 0.75rem; border-radius: 8px;',
    warning: 'background: #f59e0b; padding: 0.5rem 0.75rem; border-radius: 8px;',
    error: 'background: #ef4444; padding: 0.5rem 0.75rem; border-radius: 8px;'
  };

  // State
  let currentValue = config.value;
  let hoverValue = 0;

  // Clear element
  element.innerHTML = '';
  element.classList.add('wb-rating');
  if (config.bg !== 'none') {
    element.classList.add(`wb-rating--${config.bg}`);
  }
  element.style.cssText = `
    display: inline-flex;
    gap: 0.25rem;
    cursor: ${config.readonly ? 'default' : 'pointer'};
    ${bgStyles[config.bg] || ''}
  `;

  // Create stars
  const stars = [];
  for (let i = 1; i <= config.max; i++) {
    const star = document.createElement('span');
    star.className = 'wb-rating__star';
    star.dataset.value = i;
    star.textContent = config.icon;
    star.style.cssText = `
      font-size: 1.5rem;
      line-height: 1;
      transition: color 0.2s ease, transform 0.1s ease;
      color: ${config.bg !== 'none' ? 'rgba(255,255,255,0.3)' : '#4b5563'};
      user-select: none;
    `;
    
    if (!config.readonly) {
      // Hover effects
      star.addEventListener('mouseenter', () => {
        hoverValue = i;
        updateStars();
      });
      
      // Click handler
      star.addEventListener('click', () => {
        currentValue = i;
        updateStars();
        
        // Dispatch event
        element.dispatchEvent(new CustomEvent('wb:rating:change', {
          bubbles: true,
          detail: { value: currentValue }
        }));
        
        // Animation
        star.style.transform = 'scale(1.2)';
        setTimeout(() => star.style.transform = 'scale(1)', 150);
      });
    }
    
    element.appendChild(star);
    stars.push(star);
  }

  // Reset hover on leave
  if (!config.readonly) {
    element.addEventListener('mouseleave', () => {
      hoverValue = 0;
      updateStars();
    });
  }

  // Update visual state
  function updateStars() {
    const targetValue = hoverValue > 0 ? hoverValue : currentValue;
    const emptyColor = config.bg !== 'none' ? 'rgba(255,255,255,0.3)' : '#4b5563';
    
    stars.forEach((star, index) => {
      const value = index + 1;
      const isFull = value <= targetValue;
      
      if (isFull) {
        star.classList.add('wb-rating__star--full');
        star.style.color = config.color;
      } else {
        star.classList.remove('wb-rating__star--full');
        star.style.color = emptyColor;
      }
    });
  }

  // Initial render
  updateStars();

  // Public API
  element.wbRating = {
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = Math.max(0, Math.min(val, config.max));
      updateStars();
    }
  };

  element.dataset.wbReady = 'rating';

  return () => {
    // Cleanup
    element.innerHTML = '';
    element.classList.remove('wb-rating');
    delete element.wbRating;
  };
}

export default rating;
