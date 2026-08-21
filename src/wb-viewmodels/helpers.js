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

  element.classList.add('wb-lazy');
  
  // Show loading state
  if (!config.src) {
    element.textContent = '⏳ No data-src provided';
    return () => element.classList.remove('wb-lazy');
  }
  
  // Show placeholder while loading
  element.style.backgroundColor = 'var(--bg-tertiary, #e5e7eb)';
  element.style.minHeight = '50px';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
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
              element.classList.add('wb-lazy--loaded');
              element.classList.remove('wb-lazy--loading');
              element.style.backgroundColor = '';
              element.style.minHeight = '';
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

    element.classList.add('wb-lazy--loaded');

    return () => element.classList.remove('wb-lazy', 'wb-lazy--loading', 'wb-lazy--loaded');
  }

  element.classList.add('wb-lazy--loading');
  try { observer.observe(element); } catch (obsErr) { console.debug('[wb-lazy] observer.observe failed', obsErr); }

  return () => {
    try { observer.disconnect(); } catch (e) { /* best-effort */ }
    element.classList.remove('wb-lazy', 'wb-lazy--loading', 'wb-lazy--loaded');
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

  element.classList.add('wb-print');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of a button's text; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html's decorated
  // trigger buttons. Inline style (not a stylesheet rule) because it always
  // wins regardless of specificity, matching this function's existing approach.
  element.style.cssText = 'cursor:pointer;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid var(--border-color,#4b5563);';
  
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

  return () => element.classList.remove('wb-print');
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

  element.classList.add('wb-share');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of a button's text; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html's decorated
  // trigger buttons. Inline style (not a stylesheet rule) because it always
  // wins regardless of specificity, matching this function's existing approach.
  element.style.cssText = 'cursor:pointer;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid var(--border-color,#4b5563);';
  
  element.onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: config.title, text: config.text, url: config.url });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(config.url);
      const original = element.innerHTML;
      element.innerHTML = '✓ Copied!';
      setTimeout(() => { element.innerHTML = original; }, 2000);
    }
  };

  return () => element.classList.remove('wb-share');
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

  element.classList.add('wb-fullscreen');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of a button's text; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html's decorated
  // trigger buttons. Inline style (not a stylesheet rule) because it always
  // wins regardless of specificity, matching this function's existing approach.
  element.style.cssText = 'cursor:pointer;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid var(--border-color,#4b5563);';
  
  let targetEl = config.target ? document.querySelector(config.target) : document.documentElement;
  
  // If target is 'body', use document.body
  if (config.target === 'body') {
    targetEl = document.body;
  }
  
  let originalStyles = {};
  
  // #738 -- John, with the button reading "Exit Fullscreen": "neither fullscreen
  // or exit work". Both directions look broken for ONE reason: the label was set
  // from the request's outcome instead of the browser's actual state. Once it
  // said "Exit" while document.fullscreenElement was null, the next click took
  // the ENTER branch again (the exit branch is gated on fullscreenElement), so
  // exiting became unreachable.
  //
  // The label is now driven only from fullscreenchange, off the one source of
  // truth. That also covers Escape, which fires the event with no click at all --
  // a label managed in the click handler goes out of sync the first time anyone
  // presses it.
  const syncLabel = () => {
    element.textContent = document.fullscreenElement === targetEl
      ? '✕ Exit Fullscreen'
      : config.label;
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      // Exiting fullscreen - restore original styles
      if (targetEl) {
        targetEl.style.overflow = originalStyles.overflow || '';
        targetEl.style.overflowY = originalStyles.overflowY || '';
        targetEl.style.height = originalStyles.height || '';
      }
    }
    syncLabel();
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
    const saved = {
      overflow: targetEl.style.overflow,
      overflowY: targetEl.style.overflowY,
      height: targetEl.style.height
    };

    let request;
    try {
      request = targetEl.requestFullscreen();
    } catch (err) {
      console.error(`[WB:fullscreen] request threw: ${err.name}: ${err.message}`);
      return;
    }

    Promise.resolve(request)
      .then(() => {
        // #738: resolving is not the same as being fullscreen. Check the actual
        // state before committing anything -- a resolve that did not put THIS
        // element in the top layer would otherwise leave a stretched panel and a
        // button offering an exit that cannot work.
        if (document.fullscreenElement !== targetEl) {
          console.error('[WB:fullscreen] request resolved but',
            JSON.stringify(config.target || 'documentElement'),
            'is not the fullscreen element — leaving everything as it was');
          syncLabel();
          return;
        }
        originalStyles = saved;
        targetEl.style.overflow = 'auto';
        targetEl.style.overflowY = 'auto';
        targetEl.style.height = '100vh';
        syncLabel();
      })
      .catch((err) => {
        // Nothing was changed, so there is nothing to undo -- but SAY why.
        // The reason is the difference between "no user gesture", "blocked by
        // permissions policy" and "this element cannot be fullscreened", and
        // swallowing it left the reader with no way to tell them apart.
        console.error(`[WB:fullscreen] request rejected: ${err && err.name}: ${err && err.message}`);
        targetEl.style.overflow = saved.overflow;
        targetEl.style.overflowY = saved.overflowY;
        targetEl.style.height = saved.height;
        syncLabel();
      });
  };

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    element.classList.remove('wb-fullscreen');
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

  element.classList.add('wb-hotkey');

  // Parse key combo: "ctrl+shift+k" -> { ctrl: true, shift: true, key: 'k' }
  const parts = config.key.split('+').map(p => p.trim().toLowerCase());
  const mainKey = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsAlt = parts.includes('alt');
  const needsShift = parts.includes('shift');
  const needsMeta = parts.includes('meta') || parts.includes('cmd');

  // Show the hotkey in the element
  const keyDisplay = config.key.toUpperCase().replace(/\+/g, ' + ');
  if (!element.querySelector('.wb-hotkey__badge')) {
    const badge = document.createElement('span');
    badge.className = 'wb-hotkey__badge';
    badge.style.cssText = 'margin-left:0.5rem;padding:0.15rem 0.4rem;background:var(--bg-tertiary,#374151);border-radius:4px;font-size:0.75rem;font-family:monospace;';
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
      
      // Visual feedback - flash the element
      element.style.outline = '3px solid var(--primary, #6366f1)';
      element.style.outlineOffset = '2px';
      element.style.background = 'var(--primary, #6366f1)';
      element.style.color = 'white';
      element.classList.add('wb-hotkey--triggered');
      
      // Dispatch event
      element.dispatchEvent(new CustomEvent('wb:hotkey:triggered', {
        bubbles: true,
        detail: { key: config.key }
      }));
      
      // Click the element
      element.click();
      
      // Remove feedback after delay
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.background = '';
        element.style.color = '';
        element.classList.remove('wb-hotkey--triggered');
      }, 300);
    }
  };

  document.addEventListener('keydown', handler);

  return () => { 
    document.removeEventListener('keydown', handler); 
    element.classList.remove('wb-hotkey', 'wb-hotkey--triggered'); 
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

  element.classList.add('wb-clipboard');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.innerHTML = config.label;
  }
  // #486: padding floored at 1rem (16px) -- Standard §13, same as the other
  // decorated trigger buttons above.
  element.style.cssText = 'cursor:pointer;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid var(--border-color,#4b5563);transition:all 0.2s;';
  
  const original = element.innerHTML;

  element.onclick = async () => {
    const text = config.text || (config.target ? document.querySelector(config.target)?.textContent : '');
    if (text) {
      await navigator.clipboard.writeText(text);
      element.innerHTML = config.feedback;
      element.style.background = 'var(--success, #22c55e)';
      element.style.color = 'white';
      element.classList.add('wb-clipboard--copied');
      setTimeout(() => { 
        element.innerHTML = original; 
        element.style.background = '';
        element.style.color = '';
        element.classList.remove('wb-clipboard--copied');
      }, 2000);
    } else {
      element.innerHTML = '⚠️ Nothing to copy';
      setTimeout(() => { element.innerHTML = original; }, 2000);
    }
  };

  return () => element.classList.remove('wb-clipboard', 'wb-clipboard--copied');
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

  element.classList.add('wb-scroll');
  
  // Make it VISIBLE!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of a button's text; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html's decorated
  // trigger buttons. Inline style (not a stylesheet rule) because it always
  // wins regardless of specificity, matching this function's existing approach.
  element.style.cssText = 'cursor:pointer;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid var(--border-color,#4b5563);';

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

  return () => element.classList.remove('wb-scroll');
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

  element.classList.add('wb-truncate');
  element.style.overflow = 'hidden';
  element.style.display = '-webkit-box';
  element.style.webkitBoxOrient = 'vertical';
  element.style.webkitLineClamp = config.lines;
  element.style.wordBreak = 'break-word';

  if (config.expandable) {
    const btn = document.createElement('button');
    btn.className = 'wb-truncate__toggle';
    btn.textContent = 'Show more';
    btn.style.cssText = 'margin-top:0.5rem;background:none;border:none;color:var(--primary,#6366f1);cursor:pointer;';
    btn.onclick = () => {
      const expanded = element.classList.toggle('wb-truncate--expanded');
      element.style.webkitLineClamp = expanded ? 'unset' : config.lines;
      btn.textContent = expanded ? 'Show less' : 'Show more';
    };
    element.parentNode.insertBefore(btn, element.nextSibling);
  }

  return () => element.classList.remove('wb-truncate', 'wb-truncate--expanded');
}

/**
 * Highlight - Text highlight with VISIBLE yellow background
 * Helper Attribute: [x-highlight]
 */
export function highlight(element, options = {}) {
  const config = {
    color: options.color || element.getAttribute('color') || '#fef08a', // Yellow
    textColor: options.textColor || element.getAttribute('text-color') || '#1f2937', // Dark text
    ...options
  };

  element.classList.add('wb-highlight');
  element.style.backgroundColor = config.color;
  element.style.color = config.textColor;
  element.style.padding = '0.125rem 0.35rem';
  element.style.borderRadius = '3px';
  element.style.fontWeight = '500';

  return () => {
    element.classList.remove('wb-highlight');
    element.style.backgroundColor = '';
    element.style.color = '';
    element.style.padding = '';
    element.style.borderRadius = '';
    element.style.fontWeight = '';
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

  element.classList.add('wb-external');
  if (config.newTab) {
    element.target = '_blank';
    element.rel = 'noopener noreferrer';
  }
  if (config.icon && !element.querySelector('.wb-external__icon')) {
    const icon = document.createElement('span');
    icon.className = 'wb-external__icon';
    icon.textContent = ' ↗';
    icon.style.fontSize = '0.8em';
    element.appendChild(icon);
  }

  return () => element.classList.remove('wb-external');
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
    date: options.date || element.getAttribute('date') || element.getAttribute('to') || element.dataset.to || '',
    seconds: parseInt(options.seconds || element.getAttribute('seconds') || '0') || 0,
    format: options.format || element.getAttribute('format') || 'auto',
    ...options
  };

  element.classList.add('wb-countdown');
  element.style.fontFamily = 'monospace';
  element.style.fontSize = '1.25rem';
  element.style.fontWeight = 'bold';
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of text in a content panel; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html.
  element.style.padding = '1rem';
  element.style.background = 'var(--bg-tertiary, #374151)';
  element.style.borderRadius = '6px';
  element.style.display = 'inline-block';

  let remaining;
  
  // Determine remaining time
  if (config.date) {
    const target = new Date(config.date).getTime();
    if (isNaN(target)) {
      element.textContent = '⚠️ Invalid date';
      return () => element.classList.remove('wb-countdown');
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
      element.classList.add('wb-countdown--complete');
      element.style.color = 'var(--success, #22c55e)';
      element.dispatchEvent(new CustomEvent('wb:countdown:complete', { bubbles: true }));
    } else {
      remaining--;
    }
  };

  update();
  const interval = setInterval(update, 1000);

  return () => { 
    clearInterval(interval); 
    element.classList.remove('wb-countdown', 'wb-countdown--complete'); 
  };
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

  element.classList.add('wb-clock', `wb-clock--${config.variant}`);
  
  // Base styles
  element.style.fontFamily = 'monospace';
  element.style.display = 'inline-block';
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of text in a content panel; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html.
  element.style.padding = '1rem';
  element.style.borderRadius = '6px';
  
  // Variant-specific styles
  if (config.variant === 'led') {
    element.style.fontFamily = '"Segment7", "Digital-7", monospace';
    element.style.background = '#111';
    element.style.color = '#0f0';
    element.style.padding = '1rem 1.5rem';
    element.style.fontSize = '2rem';
    element.style.letterSpacing = '0.15em';
    element.style.textShadow = '0 0 10px #0f0, 0 0 20px #0f0';
    element.style.border = '2px solid #333';
  } else if (config.variant === 'analog') {
    // For analog, we'd need SVG - for now show digital with note
    element.style.background = 'var(--bg-tertiary, #374151)';
    element.style.fontSize = '1.25rem';
  } else {
    // Digital (default)
    element.style.background = 'var(--bg-tertiary, #374151)';
    element.style.fontSize = '1.25rem';
    element.style.fontWeight = 'bold';
  }

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
    clearInterval(interval); 
    element.classList.remove('wb-clock', `wb-clock--${config.variant}`); 
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

  element.classList.add('wb-relativetime');

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

  return () => { clearInterval(interval); element.classList.remove('wb-relativetime'); };
}

/**
 * Offline - Offline detection (VISIBLE)
 * Helper Attribute: [x-offline]
 */
export function offline(element, options = {}) {
  element.classList.add('wb-offline');
  // #486: padding floored at 1rem (16px) -- Standard §13 requires >=1rem
  // padding on every side of text in a content panel; 0.5rem (8px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html.
  element.style.padding = '1rem';
  element.style.borderRadius = '6px';
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.gap = '0.5rem';
  element.style.fontWeight = '500';

  const update = () => {
    element.classList.toggle('wb-offline--online', navigator.onLine);
    element.classList.toggle('wb-offline--offline', !navigator.onLine);
    if (navigator.onLine) {
      element.textContent = '🟢 Online';
      element.style.background = 'var(--success-bg, #dcfce7)';
      element.style.color = 'var(--success, #16a34a)';
    } else {
      element.textContent = '🔴 Offline';
      element.style.background = 'var(--error-bg, #fee2e2)';
      element.style.color = 'var(--error, #dc2626)';
    }
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();

  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    element.classList.remove('wb-offline');
  };
}

/**
 * Visible - Visibility toggle
 * Helper Attribute: [x-visible]
 */
export function visible(element, options = {}) {
  element.classList.add('wb-visible');

  element.wbVisible = {
    show: () => { element.style.display = ''; },
    hide: () => { element.style.display = 'none'; },
    toggle: () => { element.style.display = element.style.display === 'none' ? '' : 'none'; }
  };

  return () => { element.classList.remove('wb-visible'); delete element.wbVisible; };
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
    showLogs: options.showLogs ?? element.hasAttribute('data-show-logs'),
    maxMessages: parseInt(options.maxMessages || element.getAttribute('max-messages') || '50'),
    position: options.position || element.getAttribute('position') || 'bottom-right',
    ...options
  };

  element.classList.add('wb-debug');
  
  // Position styles
  const positions = {
    'bottom-right': 'bottom:1rem;right:1rem;',
    'bottom-left': 'bottom:1rem;left:1rem;',
    'top-right': 'top:1rem;right:1rem;',
    'top-left': 'top:1rem;left:1rem;'
  };
  
  element.style.cssText = `
    position:fixed;
    ${positions[config.position] || positions['bottom-right']}
    width:400px;
    max-height:300px;
    overflow-y:auto;
    background:rgba(0,0,0,0.9);
    color:#fff;
    font-family:monospace;
    font-size:0.75rem;
    border-radius:8px;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);
    z-index:99999;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = 'padding:8px 12px;background:#1a1a1a;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;position:sticky;top:0;';
  header.innerHTML = `
    <span style="font-weight:bold;">🐛 Console</span>
    <button id="wb-debug-clear" style="background:#333;border:none;color:#fff;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:0.6875rem;">Clear</button>
  `;
  element.appendChild(header);
  
  // Messages container
  const messages = document.createElement('div');
  messages.id = 'wb-debug-messages';
  messages.style.cssText = 'padding:8px;';
  element.appendChild(messages);
  
  // Message count
  let count = 0;
  
  // Add message to debug panel
  const addMessage = (type, args) => {
    if (count >= config.maxMessages) {
      messages.firstChild?.remove();
    }
    
    const colors = {
      error: '#ef4444',
      warn: '#f59e0b',
      log: '#6b7280',
      info: '#3b82f6'
    };
    
    const icons = {
      error: '❌',
      warn: '⚠️',
      log: '📝',
      info: 'ℹ️'
    };
    
    const msg = document.createElement('div');
    msg.style.cssText = `
      padding:6px 8px;
      margin-bottom:4px;
      background:rgba(255,255,255,0.05);
      border-left:3px solid ${colors[type]};
      border-radius:0 4px 4px 0;
      word-break:break-word;
    `;
    
    const text = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); }
        catch { return String(arg); }
      }
      return String(arg);
    }).join(' ');
    
    msg.innerHTML = `<span style="color:${colors[type]}">${icons[type]}</span> ${escapeHtml(text)}`;
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
  element.querySelector('#wb-debug-clear').onclick = () => {
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
    element.classList.remove('wb-debug');
  };
}

export default {
  lazy, print, share, fullscreen, hotkey, clipboard, scroll,
  truncate, highlight, external, countdown, clock, relativetime,
  offline, visible, debug
};
