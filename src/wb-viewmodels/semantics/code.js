import { readFlag, readAttr } from '../../core/read-attr.js';
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
  // A handful of CODE_THEMES entries (e.g. x-grayscale-dark) are WB's own
  // local themes, not real highlight.js CDN theme names -- blindly building
  // a cdnjs URL from ANY saved theme id 404'd for those (confirmed live:
  // x-grayscale-dark.min.css never existed on cdnjs). Use the local path
  // when the saved theme is one of ours.
  const localTheme = CODE_THEMES.find(t => t.id === savedTheme && t.path);
  // Use CDNJS for reliable loading
  link.href = localTheme ? localTheme.path : `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${savedTheme}.min.css`;
  link.setAttribute('data-highlight-theme', 'true');
  document.head.appendChild(link);
  
    // #1013: a `.hljs { background: transparent !important }` rule used to be
    // injected here. It also made every one of the 49 code themes unable to
    // paint its own background -- selecting a theme recoloured tokens only,
    // because those live on child spans this rule never touched. The
    // distinction now lives in code.css.
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
       const lang = options.language || element.getAttribute('language') || readAttr(element, 'language') || langFromClass(element) || langFromClass(codeElement);
       // We don't pass other options because pre handles the chrome
       cleanupCode = code(codeElement, { language: lang });
    }
    
    return () => {
      if (cleanupPre) cleanupPre();
      if (cleanupCode) cleanupCode();
    };
  }

  // #1016: the behavior is registered as an ATTRIBUTE (tag-map.js maps
  // 'x-code' -> 'code'), and the shipped example in behavior-examples.json is
  // `<div id="code" x-code language="javascript">`. That host is not a <code>,
  // so this used to warn and return, leaving the element with no class at all,
  // white-space: normal, and its newlines collapsed on screen -- while WB still
  // marked it x-ready, so it looked processed.
  //
  // John: "code and x-code should render the same thing, formatted code -- they
  // both do not do the same thing now."
  //
  // highlight.js needs a real <code>, so give it one: move the content into an
  // inner <code> and decorate that. Same shape the <pre> branch above already
  // uses when its inner <code> is missing.
  if (element.tagName !== 'CODE') {
    let inner = element.querySelector(':scope > code');
    if (!inner) {
      inner = document.createElement('code');
      while (element.firstChild) inner.appendChild(element.firstChild);
      element.appendChild(inner);
    }
    // The language lives on the host, not on the <code> we just created.
    const hostLang = options.language
      || element.getAttribute('language')
      || readAttr(element, 'language')
      || langFromClass(element)
      || langFromClass(inner);
    return code(inner, { ...options, language: hostLang });
  }

  const config = {
    language: options.language || element.getAttribute('language') || readAttr(element, 'language') || langFromClass(element) || '',
    showCopy: options.showCopy ?? (element.hasAttribute('show-copy') || readFlag(element, 'show-copy') || readFlag(element, 'copy')),
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || 'inline',
    scrollable: options.scrollable ?? (element.getAttribute('scrollable') === 'true' || readAttr(element, 'scrollable') === 'true'),
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
  // #1013: this used to feed an inline font-size in the Object.assign blocks
  // below. Those are classes now, so `size` becomes one too -- dropping the
  // variable instead would have silently disabled the size attribute, which
  // eslint would have accepted and nobody would have noticed until a page
  // using size="sm" rendered at full size.
  const sizeKey = sizeMap[config.size] ? config.size : 'normal';

  element.classList.add('x-code');
  element.classList.add('x-code--size-' + sizeKey);

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
    element.classList.add('x-code--in-pre');
    // #1013: was a 14-property Object.assign onto element.style -- a full
    // reset so the <pre> owns the chrome. Inline declarations outrank every
    // stylesheet, so `background-color: transparent` here beat whichever
    // code theme was selected and no theme could paint its own panel.
    // The reset now lives in .x-code--in-pre in code.css.
  } else {
    // Standalone code block (not inline, not in pre)
    // John: "not formatted right" -- a 27-line JavaScript listing rendered as
    // one wrapped paragraph with every newline collapsed.
    //
    // `variant` defaults to "inline" in code.schema.json, which is right for
    // the common case (a `<code>.x-card</code>` chip amid prose) and wrong for
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
    // ".x-card") should be forced onto one line. Multi-word inline code
    // (e.g. a formula like "Colors = Primary + 0°, 120°, 240°") must still
    // wrap normally at spaces, or it overflows its container -- confirmed
    // live on pages/themes.html's harmony-formula boxes.
    // Kept for reference: inline code used to wrap unless it was a single
    // token. See the whiteSpace line below for why that distinction was
    // wrong.

    // #1013: was a 17-property Object.assign onto element.style. Every one of
    // those conditionals is now a class, so the same decisions are made here
    // in JS but the values live in code.css and the cascade can be reasoned
    // about -- and overridden -- normally.
    element.classList.toggle('x-code--block', isBlock);
    element.classList.toggle('x-code--inline', !isBlock);
    if (!isBlock && inHeading) element.classList.add('x-code--inline-heading');
    if (isBlock && config.scrollable) element.classList.add('x-code--scrollable');
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
          // #1013 follow-up: this branch used to re-apply display/padding/
          // background as INLINE styles, because hljs rewrites them after
          // highlighting. Now that the same decisions are classes, hljs cannot
          // clobber them and nothing needs re-applying -- the base branch above
          // has already chosen x-code--block / --inline / --in-pre correctly.
          //
          // Re-adding x-code--inline here was a regression: it keyed off
          // config.variant, but variant defaults to "inline" while MULTILINE
          // content is a block listing whatever the variant says. A 27-line
          // JavaScript example got both classes, --inline won white-space
          // (nowrap), and every newline collapsed -- "code and x-code should
          // render the same thing, formatted code". That is the exact bug the
          // isMultiline check above exists to prevent.
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
      element.classList.add('x-code--copyable');
      element.title = 'Click to copy';
      
      element.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(element.textContent);
          
          // Visual feedback
          // A class, not save-and-restore: the old code captured
            // element.style.backgroundColor, which is '' once the colour comes
            // from a stylesheet, so restoring wrote an empty string and left
            // the snippet unstyled after every copy.
            element.classList.add('x-code--copied');
            setTimeout(() => element.classList.remove('x-code--copied'), 500);
        } catch (err) {
          console.error('[code] Failed to copy:', err);
        }
      });
    }
    // Block variant: Add copy button (only if not inside PRE, as PRE handles its own copy button)
    else if (!isInsidePre) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-code-wrapper';

      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);

      copyButton = document.createElement('button');
      copyButton.className = 'x-code__copy';
      copyButton.textContent = '📋';
      copyButton.title = 'Copy code';

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
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }

    languageBadge = document.createElement('span');
    languageBadge.className = 'x-code__language';
    languageBadge.textContent = config.language;

    wrapper.appendChild(languageBadge);

    // The badge is absolutely positioned above the code box via paddingTop
    // reserving room for it -- but a plain `display: inline` element (the
    // default 'inline' variant, set above) never grows its line box for
    // vertical padding, so the reserved space was painted but never laid
    // out and the badge sat directly on top of the code text. Promote to
    // inline-block so paddingTop actually reserves the space.
    element.classList.add('x-code--has-badge');
      if (copyButton) element.classList.add('x-code--has-copy');
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
