/**
 * Progress - Enhanced <progress> element
 * Adds animations, colors, labels, indeterminate state
 */
export function progress(element, options = {}) {
  const config = {
    value: parseFloat(options.value || element.value || element.dataset.value || 0),
    max: parseFloat(options.max || element.max || element.dataset.max || 100),
    showLabel: options.showLabel ?? element.hasAttribute('data-show-label'),
    animated: options.animated ?? element.dataset.animated !== 'false',
    variant: options.variant || element.dataset.variant || 'primary',
    size: options.size || element.dataset.size || 'md',
    indeterminate: options.indeterminate ?? element.hasAttribute('data-indeterminate'),
    ...options
  };

  element.classList.add('wb-progress');
  element.classList.add(`wb-progress--${config.size}`);
  element.classList.add(`wb-progress--${config.variant}`);
  
  if (config.indeterminate) {
    element.removeAttribute('value');
    element.classList.add('wb-progress--indeterminate');
  } else {
    element.value = config.value;
    element.max = config.max;
  }

  // Size mappings
  const sizes = { sm: '4px', md: '8px', lg: '12px', xl: '16px' };
  const height = sizes[config.size] || sizes.md;

  // Color mappings
  const colors = {
    primary: 'var(--primary, #6366f1)',
    success: 'var(--success, #22c55e)',
    warning: 'var(--warning, #f59e0b)',
    danger: 'var(--danger, #ef4444)',
    info: 'var(--info, #3b82f6)'
  };
  const color = colors[config.variant] || colors.primary;

  // Style the progress element
  Object.assign(element.style, {
    width: '100%',
    height: height,
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--bg-tertiary, #374151)',
    appearance: 'none',
    border: 'none'
  });

  // Inject styles for webkit/moz
  injectProgressStyles();

  // Create wrapper for label
  let wrapper = element.parentNode;
  let label = null;
  
  if (config.showLabel) {
    if (!wrapper.classList.contains('wb-progress__wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'wb-progress__wrapper';
      Object.assign(wrapper.style, {
        position: 'relative',
        width: '100%'
      });
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }
    
    label = document.createElement('span');
    label.className = 'wb-progress__label';
    Object.assign(label.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-primary, #fff)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
    });
    updateLabel();
    wrapper.appendChild(label);
  }

  function updateLabel() {
    if (label && !config.indeterminate) {
      const percent = Math.round((element.value / element.max) * 100);
      label.textContent = `${percent}%`;
    }
  }

  // Animation class
  if (config.animated && !config.indeterminate) {
    element.classList.add('wb-progress--animated');
  }

  // API
  element.wbProgress = {
    setValue: (v) => {
      element.value = Math.max(0, Math.min(v, element.max));
      updateLabel();
    },
    getValue: () => element.value,
    setMax: (m) => {
      element.max = m;
      updateLabel();
    },
    getPercent: () => (element.value / element.max) * 100,
    setIndeterminate: (indeterminate) => {
      config.indeterminate = indeterminate;
      if (indeterminate) {
        element.removeAttribute('value');
        element.classList.add('wb-progress--indeterminate');
      } else {
        element.value = config.value;
        element.classList.remove('wb-progress--indeterminate');
      }
    }
  };

  element.dataset.wbReady = 'progress';
  return () => {
    element.classList.remove('wb-progress', `wb-progress--${config.size}`, `wb-progress--${config.variant}`);
    if (label) label.remove();
  };
}

function injectProgressStyles() {
  if (document.getElementById('wb-progress-css')) return;
  
  const style = document.createElement('style');
  style.id = 'wb-progress-css';
  style.textContent = `
    .wb-progress::-webkit-progress-bar {
      background: transparent;
      border-radius: inherit;
    }
    .wb-progress::-webkit-progress-value {
      background: var(--primary, #6366f1);
      border-radius: inherit;
      transition: width 0.3s ease;
    }
    .wb-progress::-moz-progress-bar {
      background: var(--primary, #6366f1);
      border-radius: inherit;
    }
    .wb-progress--primary::-webkit-progress-value { background: var(--primary, #6366f1); }
    .wb-progress--success::-webkit-progress-value { background: var(--success, #22c55e); }
    .wb-progress--warning::-webkit-progress-value { background: var(--warning, #f59e0b); }
    .wb-progress--danger::-webkit-progress-value { background: var(--danger, #ef4444); }
    .wb-progress--info::-webkit-progress-value { background: var(--info, #3b82f6); }
    
    .wb-progress--animated::-webkit-progress-value {
      background-image: linear-gradient(
        45deg,
        rgba(255,255,255,0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255,255,255,0.15) 50%,
        rgba(255,255,255,0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
      animation: wb-progress-stripes 1s linear infinite;
    }
    
    .wb-progress--indeterminate::-webkit-progress-value {
      background: linear-gradient(90deg, transparent, var(--primary, #6366f1), transparent);
      animation: wb-progress-indeterminate 1.5s ease-in-out infinite;
    }
    
    @keyframes wb-progress-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
    
    @keyframes wb-progress-indeterminate {
      0% { margin-left: -100%; width: 100%; }
      50% { margin-left: 0%; width: 100%; }
      100% { margin-left: 100%; width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

export default { progress };
