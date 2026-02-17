/**
 * Button - Semantic enhancement for <button> and <wb-button>
 * 
 * For <wb-button>: CSS targets the tag and attributes directly.
 *   No inner <button> created. No classes added.
 *   <wb-button variant="primary" size="lg">Click</wb-button>
 *
 * For native <button>: Adds .wb-button class for opt-in styling.
 *   Only when auto-injected on plain buttons without existing styles.
 *
 * Predefined icon library via SVG.
 */

// --- Predefined Icon Map (inline SVG, 1em square) ---
const ICONS = {
  star:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>',
  check:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>',
  close:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>',
  warning:  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575zM8 5a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5A.75.75 0 008 5zm1 6a1 1 0 10-2 0 1 1 0 002 0z"/></svg>',
  info:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"/></svg>',
  error:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94z"/></svg>',
  heart:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M7.655 14.916l-.027-.012-.091-.037a13 13 0 01-2.332-1.24C3.573 12.488 1.5 10.5 1.5 7.75 1.5 5.127 3.514 3 6 3c1.313 0 2.394.644 3 1.354A3.77 3.77 0 0112 3c2.486 0 4.5 2.127 4.5 4.75 0 2.75-2.073 4.738-3.732 5.888a13 13 0 01-2.332 1.24l-.091.037-.027.012z"/></svg>',
  search:   '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/></svg>',
  edit:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758z"/></svg>',
  trash:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3zM11 3V1.75A1.75 1.75 0 009.25 0h-2.5A1.75 1.75 0 005 1.75V3H2.75a.75.75 0 000 1.5h.928l.856 8.576A1.75 1.75 0 006.282 15h3.436a1.75 1.75 0 001.748-1.924l.856-8.576h.928a.75.75 0 000-1.5z"/></svg>',
  plus:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/></svg>',
  minus:    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7.75A.75.75 0 012.75 7h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 7.75z"/></svg>',
  home:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8.156 1.835a.25.25 0 00-.312 0l-5.25 4.2A.25.25 0 002.75 6.4V13.25c0 .414.336.75.75.75h2.5a.75.75 0 00.75-.75V10h2.5v3.25c0 .414.336.75.75.75h2.5a.75.75 0 00.75-.75V6.4a.25.25 0 00.156-.365z"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8.2 8.2 0 01.701.031C9.444.095 9.99.645 10.16 1.29l.17.638c.196.742.8 1.243 1.517 1.356.239.038.474.1.702.182.702.254 1.483.1 2.048-.404l.488-.441a1.657 1.657 0 012.21.163c.403.43.543 1.04.35 1.597l-.238.668c-.263.735-.08 1.545.46 2.058.18.171.341.36.479.563.426.622.395 1.44-.09 2.011l-.443.52a1.657 1.657 0 01-.166 2.198l-.145.145a1.657 1.657 0 01-2.21.163l-.468-.424c-.513-.465-1.266-.62-1.962-.378a4 4 0 01-.563.162c-.742.196-1.244.8-1.357 1.517l-.088.546a1.657 1.657 0 01-1.597 1.39H7.297a1.657 1.657 0 01-1.597-1.39l-.088-.545c-.113-.718-.615-1.321-1.357-1.518A4 4 0 013.691 11c-.696-.242-1.449-.087-1.962.378l-.468.424a1.657 1.657 0 01-2.21-.163l-.145-.145a1.657 1.657 0 01-.166-2.198l.443-.52c.486-.57.516-1.39.09-2.011A4 4 0 01-.206 6.2l-.238-.668a1.657 1.657 0 01.35-1.597 1.657 1.657 0 012.21-.163l.488.441c.565.504 1.346.658 2.048.404.228-.083.463-.144.702-.182.717-.113 1.321-.614 1.517-1.356l.17-.638C7.01.645 7.556.095 8.299.031A8 8 0 018 0zM8 11a3 3 0 100-6 3 3 0 000 6z"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14zM7.25 7.689V2a.75.75 0 011.5 0v5.689l1.97-1.969a.749.749 0 111.06 1.06l-3.25 3.25a.749.749 0 01-1.06 0L4.22 6.78a.749.749 0 111.06-1.06z"/></svg>',
  upload:   '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14zM11.78 4.72a.749.749 0 01-1.06 0L8.75 2.749V9.5a.75.75 0 01-1.5 0V2.749L5.28 4.72a.749.749 0 01-1.06-1.06l3.25-3.25a.749.749 0 011.06 0l3.25 3.25a.749.749 0 010 1.06z"/></svg>',
  arrow_right: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"/></svg>',
  arrow_left:  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"/></svg>',
  copy:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25zM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25z"/></svg>',
  save:     '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M.143 2.31A1.75 1.75 0 011.75 1h10.5a1.75 1.75 0 011.607 1.057l1.75 4.082A1.75 1.75 0 0116 6.946V13.25A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V3.107c0-.6.306-1.158.81-1.478zM1.5 3.107V13.25c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V6.946a.25.25 0 00-.024-.106L12.82 2.832a.25.25 0 00-.229-.151H1.75a.25.25 0 00-.25.25zM8 10a2 2 0 100-4 2 2 0 000 4z"/></svg>'
};

// --- Self-contained CSS (injected once per document) ---
const STYLE_ID = 'wb-button-styles';
const BUTTON_CSS = `
/* wb-button: tag + attribute selectors — no JS classes needed */
wb-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 0.5rem; border: 1px solid transparent; border-radius: var(--radius-md, 6px);
  font-weight: 500; cursor: pointer; transition: all 0.2s ease;
  line-height: 1.5; text-decoration: none; user-select: none;
  font-family: inherit; font-size: inherit; color: inherit;
  background: var(--bg-secondary, #2a2a2a); padding: 0.5rem 1rem;
}
wb-button:focus-visible { outline: 2px solid var(--primary, #6366f1); outline-offset: 2px; }
wb-button[disabled] { opacity: 0.6; cursor: not-allowed; pointer-events: none; }

/* Sizes */
wb-button[size="xs"] { padding: 0.125rem 0.5rem; font-size: 0.75rem; }
wb-button[size="sm"] { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
wb-button[size="md"] { padding: 0.5rem 1rem; font-size: 1rem; }
wb-button[size="lg"] { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
wb-button[size="xl"] { padding: 1rem 2rem; font-size: 1.25rem; }

/* Variants */
wb-button[variant="primary"] { background: var(--primary, #6366f1); color: #fff; }
wb-button[variant="primary"]:hover { filter: brightness(0.85); }
wb-button[variant="secondary"] { background: var(--secondary, #64748b); color: #fff; }
wb-button[variant="secondary"]:hover { filter: brightness(0.85); }
wb-button[variant="success"] { background: var(--success-color, #22c55e); color: #fff; }
wb-button[variant="success"]:hover { filter: brightness(0.85); }
wb-button[variant="danger"], wb-button[variant="error"] { background: var(--danger-color, #ef4444); color: #fff; }
wb-button[variant="danger"]:hover, wb-button[variant="error"]:hover { filter: brightness(0.85); }
wb-button[variant="warning"] { background: var(--warning-color, #f59e0b); color: #fff; }
wb-button[variant="warning"]:hover { filter: brightness(0.85); }
wb-button[variant="info"] { background: var(--info-color, #3b82f6); color: #fff; }
wb-button[variant="info"]:hover { filter: brightness(0.85); }
wb-button[variant="ghost"] { background: transparent; color: var(--text-primary, #e5e5e5); border-color: var(--border-color, #404040); }
wb-button[variant="ghost"]:hover { background: var(--bg-tertiary, #333); border-color: var(--text-secondary, #aaa); }
wb-button[variant="link"] { background: transparent; color: var(--primary, #6366f1); padding: 0; border: none; }
wb-button[variant="link"]:hover { text-decoration: underline; }

/* Loading state */
wb-button[loading] { cursor: not-allowed; opacity: 0.7; }

/* Icon inside button */
wb-button .wb-button__icon { display: inline-flex; align-items: center; flex-shrink: 0; }
wb-button .wb-button__icon svg { width: 1em; height: 1em; }
wb-button .wb-button__spinner { display: inline-block; animation: wb-btn-spin 1s linear infinite; }
@keyframes wb-btn-spin { to { transform: rotate(360deg); } }

/* Native <button> opt-in styling (for auto-injected plain buttons) */
.wb-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 0.5rem; border: 1px solid transparent; border-radius: var(--radius-md, 6px);
  font-weight: 500; cursor: pointer; transition: all 0.2s ease;
  line-height: 1.5; text-decoration: none; user-select: none;
  font-family: inherit; font-size: inherit; color: inherit;
  background: var(--bg-secondary, #2a2a2a); padding: 0.5rem 1rem;
}
.wb-button:focus-visible { outline: 2px solid var(--primary, #6366f1); outline-offset: 2px; }
.wb-button:disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
`;

function ensureStyles(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BUTTON_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

function resolveIcon(name) {
  if (!name) return '';
  return ICONS[name.toLowerCase()] || name;
}

// --- Main behavior ---
export function button(element, options = {}) {
  ensureStyles(element.ownerDocument);

  const isCustom = element.tagName === 'WB-BUTTON';

  if (isCustom) {
    // <wb-button> — CSS targets the tag directly. No inner button, no classes.
    // JS only handles icon injection and loading state.
    const icon = options.icon || element.getAttribute('icon') || '';
    const iconPosition = options.iconPosition || element.getAttribute('icon-position') || 'start';
    const loading = options.loading ?? element.hasAttribute('loading');

    if (loading) {
      const spinner = document.createElement('span');
      spinner.className = 'wb-button__spinner';
      spinner.textContent = '\u23f3';
      if (iconPosition === 'start' || iconPosition === 'left') {
        element.insertBefore(spinner, element.firstChild);
      } else {
        element.appendChild(spinner);
      }
    }

    if (icon && !loading) {
      const iconEl = document.createElement('span');
      iconEl.className = 'wb-button__icon';
      const resolved = resolveIcon(icon);
      if (resolved.startsWith('<svg')) {
        iconEl.innerHTML = resolved;
      } else {
        iconEl.textContent = resolved;
      }
      if (iconPosition === 'start' || iconPosition === 'left') {
        element.insertBefore(iconEl, element.firstChild);
      } else {
        element.appendChild(iconEl);
      }
    }

    // Make it focusable and clickable
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');

    return () => {};
  }

  // Native <button> — add .wb-button class for styling
  // Skip if already styled by another system
  const hasExistingStyle = element.className.match(/wb-btn--|wb-button--/);
  const hasOtherBehaviors = Array.from(element.attributes).some(
    a => a.name.startsWith('x-') && a.name !== 'x-behavior' && a.name !== 'x-eager' && a.name !== 'x-hydrated'
  );

  if (hasExistingStyle || hasOtherBehaviors) {
    return () => {};
  }

  element.classList.add('wb-button');

  return () => {
    element.classList.remove('wb-button');
  };
}

export { ICONS };
export default { button };
