import { readFlag, readAttr } from '../core/read-attr.js';
import { writeToClipboard } from './copy.js';
import { setRule, clearRules } from '../core/dynamic-style.js';
/**
 * Utility Behaviors - Extended
 * -----------------------------------------------------------------------------
 * Miscellaneous utilities for common interactions.
 * Includes lazy loading, printing, sharing, full screen, and clipboard operations.
 * 
 * Usage:
 *   <div x-lazy data-src="img.jpg"></div>
 *   <button x-copy data-target="#code">Copy</button>
 * -----------------------------------------------------------------------------
 * Fixed implementations for all utilities
 */

/**
 * Lazy - Lazy loading for images
 * Defers image loading until element enters viewport
 * Helper Attribute: [x-lazy]
 */
export function lazy(element, options = {}) {
  const config = {
    src: options.src || element.getAttribute('src') || '',
    srcset: options.srcset || element.getAttribute('srcset') || '',
    threshold: parseFloat(options.threshold || element.getAttribute('threshold') || '0.1'),
    placeholder: options.placeholder || element.getAttribute('placeholder') || '',
    ...options
  };

  element.classList.add('x-lazy');
  
  // Show loading state
  if (!config.src) {
    element.textContent = '⏳ No data-src provided';
    return () => element.classList.remove('x-lazy');
  }
  
  // Show placeholder while loading. #779: .x-lazy--pending (centring, kept
  // after load as before) and .x-lazy--placeholder (the grey box, dropped on
  // load) in helpers.css -- both were inline styles.
  element.classList.add('x-lazy--pending', 'x-lazy--placeholder');
  if (!element.src) {
    element.alt = '⏳ Loading...';
  }

  // Create IntersectionObserver with defensive guards so a thrown error inside
  // the callback cannot cause an uncaught ReferenceError (e.g. "observer is not defined").
  let observer;
  try {
    observer = new IntersectionObserver((entries) => {
      try {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load the actual image
            if (config.src) element.src = config.src;
            if (config.srcset) element.srcset = config.srcset;

            element.onload = () => {
              element.classList.add('x-lazy--loaded');
              element.classList.remove('x-lazy--loading', 'x-lazy--placeholder');
              element.dispatchEvent(new CustomEvent('wb:lazy:loaded', {
                bubbles: true,
                detail: { src: config.src }
              }));
            };

            try { observer.disconnect(); } catch (e) { /* best-effort */ }
          }
        });
      } catch (cbErr) {
        // Defensive: ensure callback errors don't bubble to global scope in CI
        console.debug('[wb-lazy] IntersectionObserver callback error:', cbErr);
      }
    }, { threshold: config.threshold });
  } catch (instErr) {
    // IntersectionObserver might be unavailable or instantiation failed —
    // fall back to eager-load behavior without throwing.
    console.debug('[wb-lazy] IntersectionObserver unavailable, falling back:', instErr);
    if (config.src) element.src = config.src;

    element.classList.add('x-lazy--loaded');

    return () => element.classList.remove('x-lazy', 'x-lazy--loading', 'x-lazy--loaded');
  }

  element.classList.add('x-lazy--loading');
  try { observer.observe(element); } catch (obsErr) { console.debug('[wb-lazy] observer.observe failed', obsErr); }

  return () => {
    try { observer.disconnect(); } catch (e) { /* best-effort */ }
    element.classList.remove('x-lazy', 'x-lazy--loading', 'x-lazy--loaded', 'x-lazy--pending', 'x-lazy--placeholder');
  };
}

/**
 * Print - Print button (VISIBLE)
 * Helper Attribute: [x-print]
 */
export function print(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('target') || '',
    label: options.label || element.getAttribute('label') || '🖨️ Print',
    ...options
  };

  element.classList.add('x-print');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #1003 -- these declarations were assigned here as `element.style.cssText`,
  // justified inline as "always wins regardless of specificity". That is the
  // defect: it also won against the page, so #1004 could not size this button
  // when it moved into the site header. They now live, once, in
  // styles/behaviors/trigger-buttons.css -- manifest-registered, or the file
  // would never load at all (#999). The class is added above.
  
  element.onclick = () => {
    if (config.target) {
      const content = document.querySelector(config.target);
      if (content) {
        const win = window.open('', '', 'width=800,height=600');
        win.document.write(content.innerHTML);
        win.document.close();
        win.print();
        win.close();
      }
    } else {
      window.print();
    }
  };

  return () => element.classList.remove('x-print');
}

/**
 * Share - Share button (VISIBLE)
 * Helper Attribute: [x-share]
 */
export function share(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('share-title') || element.getAttribute('title') || document.title,
    text: options.text || element.getAttribute('share-text') || element.getAttribute('text') || '',
    url: options.url || element.getAttribute('share-url') || element.getAttribute('url') || window.location.href,
    label: options.label || element.getAttribute('label') || '📤 Share',
    ...options
  };

  element.classList.add('x-share');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #1003 -- these declarations were assigned here as `element.style.cssText`,
  // justified inline as "always wins regardless of specificity". That is the
  // defect: it also won against the page, so #1004 could not size this button
  // when it moved into the site header. They now live, once, in
  // styles/behaviors/trigger-buttons.css -- manifest-registered, or the file
  // would never load at all (#999). The class is added above.
  
  element.onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: config.title, text: config.text, url: config.url });
      } catch (e) {}
    } else {
      // writeToClipboard (copy.js), not a bare navigator.clipboard.writeText:
      // the bare call REJECTS whenever clipboard permission is denied or the
      // context is insecure, and inside this async handler that rejection went
      // unhandled -- pressing Share threw "Write permission denied" and the
      // button claimed nothing either way. The shared writer falls back to
      // execCommand('copy') and reports whether anything worked.
      const copied = await writeToClipboard(config.url);
      const original = element.innerHTML;
      element.innerHTML = copied ? '✓ Copied!' : '⚠️ Copy failed';
      setTimeout(() => { element.innerHTML = original; }, 2000);
    }
  };

  return () => element.classList.remove('x-share');
}

/**
 * Fullscreen - Toggle fullscreen (VISIBLE)
 * Helper Attribute: [x-fullscreen]
 */
export function fullscreen(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('target') || '',
    label: options.label || element.getAttribute('label') || '⛶ Fullscreen',
    ...options
  };

  element.classList.add('x-fullscreen');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #1003 -- these declarations were assigned here as `element.style.cssText`,
  // justified inline as "always wins regardless of specificity". That is the
  // defect: it also won against the page, so #1004 could not size this button
  // when it moved into the site header. They now live, once, in
  // styles/behaviors/trigger-buttons.css -- manifest-registered, or the file
  // would never load at all (#999). The class is added above.
  
  let targetEl = config.target ? document.querySelector(config.target) : document.documentElement;
  
  // If target is 'body', use document.body
  if (config.target === 'body') {
    targetEl = document.body;
  }
  
  // #779: the fullscreen sizing (height:100vh, overflow:auto) is the
  // .x-fullscreen-target class in trigger-buttons.css. It used to be written
  // onto the target's style attribute, with the previous values saved and
  // written back; removing a class restores whatever the target had.
  const TARGET_CLASS = 'x-fullscreen-target';

  // Handle fullscreen change events to restore styles
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      // Exiting fullscreen - restore original styles
      if (targetEl) targetEl.classList.remove(TARGET_CLASS);
      element.textContent = '⛶ Fullscreen';
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  element.onclick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if (!targetEl) {
      console.error('[WB:fullscreen] no element matches target', JSON.stringify(config.target));
      return;
    }

    // #733 -- John: "fullscreen is not working". Every side effect used to be
    // committed BEFORE requestFullscreen() settled, and its promise was thrown
    // away. Measured on a real click: document.fullscreenElement stayed null
    // while the target had already been stretched to height:100vh and the button
    // already read "Exit Fullscreen" -- a panel blown up to viewport height, a
    // control lying about the state, and no error to explain either. The restore
    // path only runs on `fullscreenchange`, which never fires for a request that
    // was rejected.
    //
    // Request first. Apply the styles and the label only once it resolves.
    let request;
    try {
      request = targetEl.requestFullscreen();
    } catch (err) {
      console.error(`[WB:fullscreen] request threw: ${err.name}: ${err.message}`);
      return;
    }

    Promise.resolve(request)
      .then(() => {
        targetEl.classList.add(TARGET_CLASS);
        element.textContent = '✕ Exit Fullscreen';
      })
      .catch((err) => {
        // Nothing was changed, so there is nothing to undo -- but SAY why.
        // The reason is the difference between "no user gesture", "blocked by
        // permissions policy" and "this element cannot be fullscreened", and
        // swallowing it left the reader with no way to tell them apart.
        console.error(`[WB:fullscreen] request rejected: ${err && err.name}: ${err && err.message}`);
        targetEl.classList.remove(TARGET_CLASS);
        element.textContent = config.label;
      });
  };

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    if (targetEl) targetEl.classList.remove(TARGET_CLASS);
    element.classList.remove('x-fullscreen');
  };
}

/**
 * Hotkey - Keyboard shortcut with visual feedback
 * Helper Attribute: [x-hotkey]
 */
export function hotkey(element, options = {}) {
  const config = {
    key: (options.key || element.getAttribute('key') || '').toLowerCase(),
    ...options
  };

  if (!config.key) {
    element.textContent = '⚠️ No data-key set';
    return () => {};
  }

  element.classList.add('x-hotkey');

  // Parse key combo: "ctrl+shift+k" -> { ctrl: true, shift: true, key: 'k' }
  const parts = config.key.split('+').map(p => p.trim().toLowerCase());
  const mainKey = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsAlt = parts.includes('alt');
  const needsShift = parts.includes('shift');
  const needsMeta = parts.includes('meta') || parts.includes('cmd');

  // Show the hotkey in the element
  const keyDisplay = config.key.toUpperCase().replace(/\+/g, ' + ');
  if (!element.querySelector('.x-hotkey__badge')) {
    const badge = document.createElement('span');
    // Styled by .x-hotkey__badge in helpers.css (#779).
    badge.className = 'x-hotkey__badge';
    badge.textContent = keyDisplay;
    element.appendChild(badge);
  }

  const handler = (e) => {
    const pressedKey = e.key.toLowerCase();
    
    if (pressedKey === mainKey &&
        e.ctrlKey === needsCtrl &&
        e.altKey === needsAlt &&
        e.shiftKey === needsShift &&
        e.metaKey === needsMeta) {
      e.preventDefault();
      
      // Visual feedback - flash the element: .x-hotkey--triggered (#779).
      element.classList.add('x-hotkey--triggered');
      
      // Dispatch event
      element.dispatchEvent(new CustomEvent('wb:hotkey:triggered', {
        bubbles: true,
        detail: { key: config.key }
      }));
      
      // Click the element
      element.click();
      
      // Remove feedback after delay
      setTimeout(() => {
        element.classList.remove('x-hotkey--triggered');
      }, 300);
    }
  };

  document.addEventListener('keydown', handler);

  return () => { 
    document.removeEventListener('keydown', handler); 
    element.classList.remove('x-hotkey', 'x-hotkey--triggered'); 
  };
}

/**
 * Clipboard - Copy to clipboard (VISIBLE BUTTON)
 * Helper Attribute: [x-clipboard]
 */
export function clipboard(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('target') || '',
    text: options.text || element.getAttribute('clipboard-text') || element.getAttribute('text') || '',
    label: options.label || element.getAttribute('label') || '📋 Copy to Clipboard',
    feedback: options.feedback || element.getAttribute('feedback') || '✓ Copied!',
    ...options
  };

  element.classList.add('x-clipboard');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.innerHTML = config.label;
  }
  // #1003 -- these declarations were assigned here as `element.style.cssText`,
  // justified inline as "always wins regardless of specificity". That is the
  // defect: it also won against the page, so #1004 could not size this button
  // when it moved into the site header. They now live, once, in
  // styles/behaviors/trigger-buttons.css -- manifest-registered, or the file
  // would never load at all (#999). The class is added above.
  
  const original = element.innerHTML;

  element.onclick = async () => {
    const text = config.text || (config.target ? document.querySelector(config.target)?.textContent : '');
    if (text) {
      // Same unhandled-rejection trap as share() above; the shared writer
      // falls back instead of throwing when permission is denied.
      if (!(await writeToClipboard(text))) {
        element.innerHTML = '⚠️ Copy failed';
        setTimeout(() => { element.innerHTML = original; }, 2000);
        return;
      }
      // The success colours are .x-clipboard--copied in trigger-buttons.css (#779).
      element.innerHTML = config.feedback;
      element.classList.add('x-clipboard--copied');
      setTimeout(() => {
        element.innerHTML = original;
        element.classList.remove('x-clipboard--copied');
      }, 2000);
    } else {
      element.innerHTML = '⚠️ Nothing to copy';
      setTimeout(() => { element.innerHTML = original; }, 2000);
    }
  };

  return () => element.classList.remove('x-clipboard', 'x-clipboard--copied');
}

/**
 * Scroll - Scroll to element (VISIBLE)
 * Helper Attribute: [x-scroll]
 */
export function scroll(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('scroll-to') || element.getAttribute('target') || '',
    behavior: options.behavior || element.getAttribute('behavior') || 'smooth',
    offset: parseInt(options.offset || element.getAttribute('offset') || '0'),
    label: options.label || element.getAttribute('label') || '↓ Scroll',
    ...options
  };

  element.classList.add('x-scroll');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #1003 -- these declarations were assigned here as `element.style.cssText`,
  // justified inline as "always wins regardless of specificity". That is the
  // defect: it also won against the page, so #1004 could not size this button
  // when it moved into the site header. They now live, once, in
  // styles/behaviors/trigger-buttons.css -- manifest-registered, or the file
  // would never load at all (#999). The class is added above.

  element.onclick = (e) => {
    e.preventDefault();
    if (config.target === 'top') {
      window.scrollTo({ top: 0, behavior: config.behavior });
    } else if (config.target === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: config.behavior });
    } else {
      const target = document.querySelector(config.target || element.getAttribute('href'));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - config.offset;
        window.scrollTo({ top, behavior: config.behavior });
      }
    }
  };

  return () => element.classList.remove('x-scroll');
}

/**
 * Truncate - Text truncation
 * Helper Attribute: [x-truncate]
 */
export function truncate(element, options = {}) {
  const config = {
    lines: parseInt(options.lines || element.getAttribute('lines') || '1'),
    // Was hardcoded to hasAttribute('data-expandable') only -- the one Law 11
    // violation that lived in the behavior code itself rather than the
    // markup (docs/claude/TIER1-LAWS.md); plain `expandable` never worked.
    expandable: options.expandable ?? element.hasAttribute('expandable'),
    ...options
  };

  // #779: the clamp is .x-truncate in helpers.css reading
  // --x-truncate-lines (a generated rule when not 1); expanded is its
  // --expanded modifier; the toggle button is .x-truncate__toggle.
  element.classList.add('x-truncate');
  if (config.lines !== 1) setRule(element, 'lines', { '--x-truncate-lines': String(config.lines) });

  let btn = null;
  if (config.expandable) {
    btn = document.createElement('button');
    btn.className = 'x-truncate__toggle';
    btn.textContent = 'Show more';
    btn.onclick = () => {
      const expanded = element.classList.toggle('x-truncate--expanded');
      btn.textContent = expanded ? 'Show less' : 'Show more';
    };
    element.parentNode.insertBefore(btn, element.nextSibling);
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-truncate', 'x-truncate--expanded');
  };
}

/**
 * Highlight - Text highlight with VISIBLE yellow background
 * Helper Attribute: [x-highlight]
 */
export function highlight(element, options = {}) {
  // #779: the yellow-on-dark default is .x-highlight in helpers.css; an
  // author's color / text-color travels as a generated rule.
  const config = {
    color: options.color || element.getAttribute('color') || '',
    textColor: options.textColor || element.getAttribute('text-color') || '',
    ...options
  };

  element.classList.add('x-highlight');
  setRule(element, 'colors', { backgroundColor: config.color, color: config.textColor }, { weight: 2 });

  return () => {
    clearRules(element);
    element.classList.remove('x-highlight');
  };
}

/**
 * Helper Attribute: [x-external]
 * External - External link handler
 */
export function external(element, options = {}) {
  const config = {
    icon: options.icon ?? element.getAttribute('icon') !== 'false',
    newTab: options.newTab ?? element.getAttribute('new-tab') !== 'false',
    ...options
  };

  element.classList.add('x-external');
  if (config.newTab) {
    element.target = '_blank';
    element.rel = 'noopener noreferrer';
  }
  if (config.icon && !element.querySelector('.x-external__icon')) {
    const icon = document.createElement('span');
    icon.className = 'x-external__icon'; // 0.8em: helpers.css (#779)
    icon.textContent = ' ↗';
    element.appendChild(icon);
  }

  return () => element.classList.remove('x-external');
}

/**
 * Helper Attribute: [x-countdown]
 * Use: x-countdown data-seconds="60" OR data-date="2025-12-31"
 */
export function countdown(element, options = {}) {
  const config = {
    // `to` checked alongside `date`: pages/behaviors.html's own demo markup
    // uses to="...", scripts/generate-behaviors-page.js emits data-to="...",
    // and neither ever matched this function's `date` -- a three-way name
    // mismatch that always left config.date '' and silently fell through to
    // the unconditional 60s default below (#376).
    date: options.date || element.getAttribute('date') || element.getAttribute('to') || readAttr(element, 'to') || '',
    seconds: parseInt(options.seconds || element.getAttribute('seconds') || '0') || 0,
    format: options.format || element.getAttribute('format') || 'auto',
    ...options
  };

  // #779: the panel is .x-countdown in helpers.css (with #486's 1rem padding
  // floor), and the finished colour is .x-countdown--complete.
  element.classList.add('x-countdown');

  let remaining;
  
  // Determine remaining time
  if (config.date) {
    const target = new Date(config.date).getTime();
    if (isNaN(target)) {
      element.textContent = '⚠️ Invalid date';
      return () => element.classList.remove('x-countdown');
    }
    remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
  } else if (config.seconds > 0) {
    remaining = config.seconds;
  } else {
    // Default: 60 second countdown
    remaining = 60;
  }
  
  const update = () => {
    if (remaining < 0) remaining = 0;
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    // Format display
    let display;
    if (config.format === 'auto') {
      if (days > 0) {
        display = `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else if (hours > 0) {
        display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    } else {
      display = config.format
        .replace('DD', String(days).padStart(2, '0'))
        .replace('HH', String(hours).padStart(2, '0'))
        .replace('MM', String(minutes).padStart(2, '0'))
        .replace('SS', String(seconds).padStart(2, '0'));
    }

    element.textContent = display;

    if (remaining === 0) {
      clearInterval(interval);
      element.classList.add('x-countdown--complete');
      element.dispatchEvent(new CustomEvent('wb:countdown:complete', { bubbles: true }));
    } else {
      remaining--;
    }
  };

  update();
  const interval = setInterval(update, 1000);

  return () => { 
    clearInterval(interval); 
    element.classList.remove('x-countdown', 'x-countdown--complete'); 
  };
}

// The faces helpers.css styles, in the order the docs and schema list them.
const CLOCK_VARIANTS = ['digital', 'led', 'analog'];

/**
 * One of CLOCK_VARIANTS for whatever the author wrote. Whitespace and case are
 * forgiven: the playground re-renders on every keystroke, so a half-typed
 * `variant="analogue` arrives as "analogue\n    " (#1229). Anything else
 * renders digital, and the warning says what would have worked.
 */
function clockVariant(raw) {
  const wanted = String(raw ?? '').trim().toLowerCase();
  if (!wanted) return 'digital';
  if (CLOCK_VARIANTS.includes(wanted)) return wanted;
  const near = CLOCK_VARIANTS.find((v) => wanted.startsWith(v) || v.startsWith(wanted));
  console.warn(
    `[x-clock] variant="${wanted}" is not a clock face -- use one of: ${CLOCK_VARIANTS.join(', ')}` +
      `${near ? ` (did you mean "${near}"?)` : ''}. Showing digital.`
  );
  return 'digital';
}

/**
 * Clock - Live clock with VARIANTS (digital, led, analog)
 * Helper Attribute: [x-clock]
 */
export function clock(element, options = {}) {
  const config = {
    variant: options.variant || element.getAttribute('variant') || 'digital',
    format: options.format || element.getAttribute('format') || '24',
    showSeconds: (options.showSeconds ?? element.getAttribute('show-seconds')) !== 'false',
    ...options
  };
  config.variant = clockVariant(config.variant);

  // #779: base (with #486's 1rem padding floor), led, analog and the
  // digital default are .x-clock rules in helpers.css, keyed on the
  // x-clock--{variant} class added here.
  element.classList.add('x-clock', `x-clock--${config.variant}`);

  const update = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let suffix = '';

    if (config.format === '12') {
      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}${config.showSeconds ? ':' + seconds : ''}${suffix}`;
    element.textContent = timeStr;
  };

  update();
  const updateInterval = setInterval(update, 1000);

  return () => { 
    clearInterval(updateInterval);
    element.classList.remove('x-clock', `x-clock--${config.variant}`);
  };
}

/**
 * RelativeTime - Relative time display
 * Helper Attribute: [x-relativetime]
 */
export function relativetime(element, options = {}) {
  const config = {
    date: options.date || element.getAttribute('date') || element.getAttribute('datetime') || '',
    refresh: parseInt(options.refresh || element.getAttribute('refresh') || '60000'),
    ...options
  };

  element.classList.add('x-relativetime');

  const update = () => {
    const date = new Date(config.date);
    if (isNaN(date.getTime())) {
      element.textContent = '⚠️ Invalid date';
      return;
    }
    
    const now = Date.now();
    const diff = now - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) element.textContent = `${days} day${days > 1 ? 's' : ''} ago`;
    else if (hours > 0) element.textContent = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    else if (minutes > 0) element.textContent = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    else element.textContent = 'Just now';
  };

  update();
  const timerInterval = setInterval(update, config.refresh);

  return () => { clearInterval(interval); element.classList.remove('x-relativetime'); };
}

/**
 * Offline - Offline detection (VISIBLE)
 * Helper Attribute: [x-offline]
 */
export function offline(element, options = {}) {
  // #779: the pill (with #486's 1rem padding floor) and its online/offline
  // colours are .x-offline / --online / --offline in helpers.css.
  element.classList.add('x-offline');

  const update = () => {
    element.classList.toggle('x-offline--online', navigator.onLine);
    element.classList.toggle('x-offline--offline', !navigator.onLine);
    element.textContent = navigator.onLine ? '🟢 Online' : '🔴 Offline';
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();

  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    element.classList.remove('x-offline');
  };
}

/**
 * Visible - Visibility toggle
 * Helper Attribute: [x-visible]
 */
export function visible(element, options = {}) {
  element.classList.add('x-visible');

  // Hidden is .x-visible--hidden (helpers.css), not display:none on the
  // style attribute (#779).
  element.wbVisible = {
    show: () => { element.classList.remove('x-visible--hidden'); },
    hide: () => { element.classList.add('x-visible--hidden'); },
    toggle: () => { element.classList.toggle('x-visible--hidden'); }
  };

  return () => { element.classList.remove('x-visible', 'x-visible--hidden'); delete element.wbVisible; };
}

/**
 * Debug - Console error overlay
 * Shows console errors, warnings, and logs on screen
 * Helper Attribute: [x-debug]
 */
export function debug(element, options = {}) {
  const config = {
    showErrors: options.showErrors ?? element.getAttribute('show-errors') !== 'false',
    showWarnings: options.showWarnings ?? element.getAttribute('show-warnings') !== 'false',
    showLogs: options.showLogs ?? readFlag(element, 'show-logs'),
    maxMessages: parseInt(options.maxMessages || element.getAttribute('max-messages') || '50'),
    position: options.position || element.getAttribute('position') || 'bottom-right',
    ...options
  };

  // #779: the panel, its corner (x-debug--{position}), header, clear button,
  // message list and per-type message accent are .x-debug* rules in
  // helpers.css -- all of it was cssText / style="" here.
  const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  const position = POSITIONS.includes(config.position) ? config.position : 'bottom-right';
  element.classList.add('x-debug', `x-debug--${position}`);

  // Header
  const header = document.createElement('div');
  header.className = 'x-debug__header';
  header.innerHTML = `
    <span class="x-debug__title">🐛 Console</span>
    <button id="x-debug-clear" class="x-debug__clear">Clear</button>
  `;
  element.appendChild(header);

  // Messages container
  const messages = document.createElement('div');
  messages.id = 'x-debug-messages';
  messages.className = 'x-debug__messages';
  element.appendChild(messages);
  
  // Message count
  let count = 0;
  
  // Add message to debug panel
  const addMessage = (type, args) => {
    if (count >= config.maxMessages) {
      messages.firstChild?.remove();
    }
    
    const icons = {
      error: '❌',
      warn: '⚠️',
      log: '📝',
      info: 'ℹ️'
    };
    
    // The per-type accent colour is .x-debug__msg--{type} (#779).
    const msg = document.createElement('div');
    msg.className = `x-debug__msg x-debug__msg--${type}`;
    
    const text = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); }
        catch { return String(arg); }
      }
      return String(arg);
    }).join(' ');
    
    msg.innerHTML = `<span class="x-debug__icon">${icons[type]}</span> ${escapeHtml(text)}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    count++;
  };
  
  // Helper to escape HTML
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;
  
  // Override console methods
  if (config.showErrors) {
    console.error = (...args) => {
      addMessage('error', args);
      originalError.apply(console, args);
    };
  }
  
  if (config.showWarnings) {
    console.warn = (...args) => {
      addMessage('warn', args);
      originalWarn.apply(console, args);
    };
  }
  
  if (config.showLogs) {
    console.log = (...args) => {
      addMessage('log', args);
      originalLog.apply(console, args);
    };
    console.info = (...args) => {
      addMessage('info', args);
      originalInfo.apply(console, args);
    };
  }
  
  // Catch uncaught errors
  const errorHandler = (event) => {
    addMessage('error', [`${event.message} at ${event.filename}:${event.lineno}`]);
  };
  window.addEventListener('error', errorHandler);
  
  // Catch unhandled promise rejections
  const rejectionHandler = (event) => {
    addMessage('error', ['Unhandled Promise:', event.reason]);
  };
  window.addEventListener('unhandledrejection', rejectionHandler);
  
  // Clear button
  element.querySelector('#x-debug-clear').onclick = () => {
    messages.innerHTML = '';
    count = 0;
  };
  
  return () => {
    // Restore original console methods
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
    console.info = originalInfo;
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', rejectionHandler);
    element.classList.remove('x-debug', `x-debug--${position}`);
  };
}

export default {
  lazy, print, share, fullscreen, hotkey, clipboard, scroll,
  truncate, highlight, external, countdown, clock, relativetime,
  offline, visible, debug
};
