import hljs from '../../lib/highlight.js';
import { pre } from './pre.js';
import { CODE_THEMES } from '../codecontrol.js';

// Inject CSS if not present (codecontrol behavior will override if used)
if (!document.querySelector('link[data-highlight-theme]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // Check localStorage for saved preference from codecontrol
  let savedTheme = localStorage.getItem('x-code-theme') || 'atom-one-dark-reasonable';
  // A saved theme id can go stale if it's ever removed from CODE_THEMES
  // (e.g. rose-pine/rose-pine-moon were removed after confirming they
  // don't exist at cdnjs's pinned highlight.js 11.9.0, even though they
  // were a valid, selectable option when a visitor's browser saved them)
  // -- blindly building a cdnjs URL from an unrecognized id 404s forever
  // for that visitor, since nothing here ever re-validates or clears it.
  // Fall back to the default whenever the saved id isn't a CURRENT,
  // recognized theme at all, not just when it lacks a local `.path`.
  if (!CODE_THEMES.some((t) => t.id === savedTheme)) {
    savedTheme = 'atom-one-dark-reasonable';
  }
  // A handful of CODE_THEMES entries (e.g. wb-grayscale-dark) are WB's own
  // local themes, not real highlight.js CDN theme names -- blindly building
  // a cdnjs URL from ANY saved theme id 404'd for those (confirmed live:
  // wb-grayscale-dark.min.css never existed on cdnjs). Use the local path
  // when the saved theme is one of ours.
  const localTheme = CODE_THEMES.find(t => t.id === savedTheme && t.path);
  // Use CDNJS for reliable loading
  link.href = localTheme ? localTheme.path : `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${savedTheme}.min.css`;
  link.setAttribute('data-highlight-theme', 'true');
  document.head.appendChild(link);
  
  // Override background to transparent to let pre/code container handle it
  const style = document.createElement('style');
  style.textContent = `
    .hljs { background: transparent !important; }
  `;
  document.head.appendChild(style);
}

/** Derive a highlight.js language from a `language-xxx` class (markdown/hljs convention). */
function langFromClass(el) {
  if (!el || !el.className) return '';
  const m = String(el.className).match(/\blanguage-([\w-]+)/i);
  const lang = m && m[1];
  return lang && lang.toLowerCase() !== 'undefined' ? lang : '';
}

/**
 * Code - Enhanced <code> element
 * Adds syntax styling, copy button, language badge
 * Helper Attribute: [x-behavior="code"]
 */
export function code(element, options = {}) {
  // Handle <pre> wrapper - delegate to pre behavior for chrome, and apply code behavior to inner code for highlighting
  if (element.tagName === 'PRE') {
    // 1. Apply pre behavior (chrome: copy, badge, line numbers, scrollable)
    const cleanupPre = pre(element, options);
    
    // 2. Apply code behavior to inner code (highlighting)
    let codeElement = element.querySelector('code');
    let cleanupCode = () => {};
    
    // Auto-wrap content in code if missing (fixes issue where pre content isn't highlighted)
    if (!codeElement) {
        codeElement = document.createElement('code');
        // Move all child nodes to code element
        while (element.firstChild) {
            codeElement.appendChild(element.firstChild);
        }
        element.appendChild(codeElement);
    }
    
    if (codeElement) {
       // Pass language if set on pre — fall back to a language-xxx class on
       // the pre or the inner code element (standard markdown/hljs convention).
       const lang = options.language || element.getAttribute('language') || element.dataset.language || langFromClass(element) || langFromClass(codeElement);
       // We don't pass other options because pre handles the chrome
       cleanupCode = code(codeElement, { language: lang });
    }
    
    return () => {
      if (cleanupPre) cleanupPre();
      if (cleanupCode) cleanupCode();
    };
  }

  if (element.tagName !== 'CODE') {
    console.warn('[code] Element must be a <code>');
    return () => {};
  }

  const config = {
    language: options.language || element.getAttribute('language') || element.dataset.language || langFromClass(element) || '',
    showCopy: options.showCopy ?? (element.hasAttribute('show-copy') || element.hasAttribute('data-show-copy') || element.hasAttribute('data-copy')),
    variant: options.variant || element.getAttribute('variant') || element.dataset.variant || 'inline',
    scrollable: options.scrollable ?? (element.getAttribute('scrollable') === 'true' || element.dataset.scrollable === 'true'),
    // No `size` given -> normal (matches surrounding text, 1em) — every plain
    // <code> project-wide (table cells, inline mentions in prose, etc.) was
    // defaulting to 'xs' (0.55em, an INLINE style that beats any CSS fix),
    // rendering at little more than half the size of the text around it.
    // xs/sm/md/lg/xl remain available as an explicit opt-in for genuinely
    // compact code (e.g. a badge-like inline mention).
    size: options.size || element.getAttribute('size') || null,
    ...options
  };

  const sizeMap = {
    xs: '0.55em',
    sm: '0.6em',
    md: '0.65em',
    lg: '0.75em',
    xl: '0.85em',
    normal: '1em'
  };
  const fontSize = sizeMap[config.size] || sizeMap.normal;

  element.classList.add('x-code');

  const isInsidePre = element.parentElement && element.parentElement.tagName === 'PRE';

  // #545: inline code inherits its font-size from the surrounding text
  // (fontSize: 'normal' -> 1em, see sizeMap above). Inside a heading that
  // inherited size can be 2x+ normal body text (e.g. an h2's 1.75rem), so
  // the SAME em-relative padding below that reads correctly at 16px body
  // text renders as only a few px at heading scale -- flagged by the
  // content-panel-edge compliance test. Confirmed live: a <code> naming a
  // tag inside "<h2>Audio <code>&lt;audio&gt;</code></h2>" (the pattern
  // used throughout demos/site/content.html, forms.html, interactive.html)
  // computed to 4.2px padding (0.15em * 28px). Scope the bigger, absolute
  // padding to headings only -- switching ALL inline code to rem-based
  // padding would recreate the "58x60px box for a 2-char snippet"
  // regression code.css's own history already documents fixing (see that
  // file's comment on the old project-wide `padding: 1rem !important`
  // attempt).
  const inHeading = !isInsidePre && !!element.closest('h1, h2, h3, h4, h5, h6');

  // Base styling
  if (isInsidePre) {
    Object.assign(element.style, {
      fontFamily: 'inherit',
      fontSize: 'inherit',
      padding: '0',
      borderRadius: '0',
      backgroundColor: 'transparent',
      color: 'inherit',
      border: 'none',
      display: 'inline', // Let pre handle block layout
      whiteSpace: 'inherit',
      wordBreak: 'inherit',
      verticalAlign: 'baseline',
      boxShadow: 'none',
      visibility: 'visible',
      opacity: '1'
    });
  } else {
    // Standalone code block (not inline, not in pre)
    // John: "not formatted right" -- a 27-line JavaScript listing rendered as
    // one wrapped paragraph with every newline collapsed.
    //
    // `variant` defaults to "inline" in code.schema.json, which is right for
    // the common case (a `<code>wb-card</code>` chip amid prose) and wrong for
    // a standalone listing: an inline box gets `white-space: normal`, so every
    // newline in the source collapsed to a space.
    //
    // Content that CONTAINS a newline is a block listing whatever the variant
    // default says. Keyed on the content rather than on the attribute so the
    // many single-line inline chips across the docs are untouched -- they have
    // no newline and keep their existing inline treatment.
    const isMultiline = /\n/.test((element.textContent || '').trim());
    const isBlock = config.variant !== 'inline' || isMultiline;
    // Only single-token content (no whitespace, e.g. a tag-name chip like
    // "wb-card") should be forced onto one line. Multi-word inline code
    // (e.g. a formula like "Colors = Primary + 0°, 120°, 240°") must still
    // wrap normally at spaces, or it overflows its container -- confirmed
    // live on pages/themes.html's harmony-formula boxes.
    const isSingleToken = !/\s/.test((element.textContent || '').trim());

    Object.assign(element.style, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: fontSize,
      // John: "the code demos cannot take up more space than the line
      // allows" -- 1rem on all 4 sides of an inline chip inside a heading
      // (this branch's original fix for #545's too-small em-padding
      // problem) overcorrected into the opposite problem: a wide enough
      // box to overflow the heading's own line. 0.25rem/0.5rem reads fine
      // at heading scale without doing that.
      padding: !isBlock ? (inHeading ? '0.25rem 0.5rem' : '0.15em 0.3em') : '0.5rem 0.75rem',
      borderRadius: 'var(--radius-sm, 4px)',
      backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.1))',
      color: 'var(--text-primary, inherit)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      display: !isBlock ? 'inline' : 'block',
      // A single-token inline code chip (e.g. `<wb-card>`) must stay on one
      // line -- `white-space: normal` lets the browser wrap at the hyphen
      // inside "wb-card" like a hyphenated English word, splitting "<wb-"
      // onto one line and "card>" onto the next (confirmed live on
      // pages/components.html). `overflow:hidden` is a no-op on a plain
      // `display:inline` box, so `nowrap` here can't cause clipping -- it
      // just lets the token run as one atomic unit on its line, same as
      // block/pre code already does via `pre`/`pre-wrap`.
      whiteSpace: !isBlock ? (isSingleToken ? 'nowrap' : 'normal') : (config.scrollable ? 'pre' : 'pre-wrap'),
      wordBreak: 'break-word', // Always break to prevent overflow
      overflowWrap: 'break-word',
      overflow: (isBlock && config.scrollable) ? 'auto' : 'hidden',
      verticalAlign: 'baseline',
      maxWidth: '100%'
    });
  }

  // Syntax Highlighting with highlight.js
  if (config.language) {
    // Add language class for hljs
    element.classList.add(`language-${config.language}`);
    
    // Highlight
    try {
        // Check if already highlighted to prevent warnings/errors
        if (!element.dataset.highlighted && hljs) {
            hljs.highlightElement(element);
        }
        
        // Fix for inline code: hljs adds 'hljs' class which might set display: block and padding
        if (!isInsidePre && config.variant === 'inline') {
            element.style.display = 'inline';
            // #545/#612: same heading-scale padding fix as the base styling
            // above -- hljs re-sets padding after highlighting, so it must
            // repeat the inHeading check or a highlighted <code> in a
            // heading would lose it.
            element.style.padding = inHeading ? '0.25rem 0.5rem' : '0.2em 0.4em';
            element.style.backgroundColor = 'var(--bg-tertiary, rgba(255,255,255,0.1))'; // Keep our background for inline
        } else if (isInsidePre) {
             // Ensure background is transparent so pre's background shows
             element.style.backgroundColor = 'transparent';
             element.style.padding = '0';
        }
    } catch (e) {
        console.warn('[code] Highlight failed:', e);
    }
  }

  let wrapper = null;
  let copyButton = null;
  let languageBadge = null;

  async function copyCode() {
    const text = element.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      element.dispatchEvent(new CustomEvent('wb:code:copy', {
        bubbles: true,
        detail: { text }
      }));
      return text;
    } catch (err) {
      console.error('[code] Failed to copy:', err);
      throw err;
    }
  }

  element.copy = copyCode;

  // Add copy functionality
  if (config.showCopy) {
    // Inline variant: Click to copy
    if (config.variant === 'inline' && !isInsidePre) {
      element.style.cursor = 'pointer';
      element.title = 'Click to copy';
      
      element.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(element.textContent);
          
          // Visual feedback
          const originalBg = element.style.backgroundColor;
          element.style.backgroundColor = 'var(--success-color, #22c55e)';
          element.style.color = 'white';
          
          setTimeout(() => {
            element.style.backgroundColor = originalBg;
            element.style.color = 'var(--text-primary, inherit)';
          }, 500);
        } catch (err) {
          console.error('[code] Failed to copy:', err);
        }
      });
    }
    // Block variant: Add copy button (only if not inside PRE, as PRE handles its own copy button)
    else if (!isInsidePre) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';

      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);

      copyButton = document.createElement('button');
      copyButton.className = 'x-code__copy';
      copyButton.textContent = '📋';
      copyButton.title = 'Copy code';
      copyButton.style.cssText = `
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        background: var(--bg-secondary, #1f2937);
        border: 1px solid var(--border-color, #374151);
        color: var(--text-secondary, #9ca3af);
        padding: 0.1rem 0.3rem;
        border-radius: var(--radius-sm, 3px);
        cursor: pointer;
        font-size: 0.6rem;
        line-height: 1;
        transition: all 0.2s ease;
      `;

      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.backgroundColor = 'var(--bg-tertiary, #374151)';
      });

      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = 'var(--bg-secondary, #1f2937)';
      });

      copyButton.addEventListener('click', async () => {
        try {
          await copyCode();
          copyButton.textContent = '✓';
          setTimeout(() => {
            copyButton.textContent = '📋';
          }, 2000);
        } catch (err) {
          console.error('[code] Failed to copy:', err);
        }
      });

      wrapper.appendChild(copyButton);
    }
  }

  // Add language badge
  if (config.language && !isInsidePre) { // Only add badge if not inside PRE (PRE handles its own badge)
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }

    languageBadge = document.createElement('span');
    languageBadge.className = 'x-code__language';
    languageBadge.textContent = config.language;
    languageBadge.style.cssText = `
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      background: var(--primary, #6366f1);
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    `;

    wrapper.appendChild(languageBadge);

    // The badge is absolutely positioned above the code box via paddingTop
    // reserving room for it -- but a plain `display: inline` element (the
    // default 'inline' variant, set above) never grows its line box for
    // vertical padding, so the reserved space was painted but never laid
    // out and the badge sat directly on top of the code text. Promote to
    // inline-block so paddingTop actually reserves the space.
    if (element.style.display === 'inline') {
      element.style.display = 'inline-block';
    }

    if (copyButton) {
      element.style.paddingTop = '2.5rem';
    } else {
      element.style.paddingTop = '2rem';
    }
  }

  return () => {
    element.classList.remove('x-code');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
    if (element.copy === copyCode) {
      delete element.copy;
    }
  };
}


export default code;
