/**
 * Checkbox - Enhanced <input type="checkbox">
 * 
 * CSS targets input[type="checkbox"] directly with appearance: none.
 * JS does NOTHING except set indeterminate state if requested.
 * No wrapper, no fake span, no classes.
 *
 * Usage:
 *   <label><input type="checkbox"> Unchecked</label>
 *   <label><input type="checkbox" checked> Checked</label>
 *   <label><input type="checkbox" disabled> Disabled</label>
 *   <label><input type="checkbox" variant="success"> Success</label>
 */

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 4px;
      background-color: var(--bg-primary, #ffffff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      cursor: pointer;
      vertical-align: middle;
      margin: 0 0.25rem 0 0;
    }

    input[type="checkbox"]:checked {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    input[type="checkbox"]:indeterminate {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='3' y='7' width='10' height='2' rx='1'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    input[type="checkbox"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
      border-color: var(--primary, #6366f1);
      outline: none;
    }

    input[type="checkbox"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--bg-secondary, #f3f4f6);
    }

    /* Sizes via attribute */
    input[type="checkbox"][size="xs"] { width: 0.75rem; height: 0.75rem; }
    input[type="checkbox"][size="sm"] { width: 0.875rem; height: 0.875rem; }
    input[type="checkbox"][size="lg"] { width: 1.5rem; height: 1.5rem; }

    /* Variants via attribute */
    input[type="checkbox"][variant="success"]:checked,
    input[type="checkbox"][variant="success"]:indeterminate {
      background-color: var(--success-color, #22c55e);
      border-color: var(--success-color, #22c55e);
    }
    input[type="checkbox"][variant="success"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
    }

    input[type="checkbox"][variant="warning"]:checked,
    input[type="checkbox"][variant="warning"]:indeterminate {
      background-color: var(--warning-color, #f59e0b);
      border-color: var(--warning-color, #f59e0b);
    }
    input[type="checkbox"][variant="warning"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
    }

    input[type="checkbox"][variant="danger"]:checked,
    input[type="checkbox"][variant="danger"]:indeterminate {
      background-color: var(--danger-color, #ef4444);
      border-color: var(--danger-color, #ef4444);
    }
    input[type="checkbox"][variant="danger"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function checkbox(element, options = {}) {
  if (element.tagName !== 'INPUT' || element.type !== 'checkbox') return () => {};

  injectStyles();

  // Only JS action: set indeterminate if requested
  if (options.indeterminate ?? element.hasAttribute('indeterminate')) {
    element.indeterminate = true;
  }

  return () => {};
}

export default { checkbox };
