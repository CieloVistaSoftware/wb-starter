/**
 * Pre - Enhanced <pre> element (Preformatted Text)
 * Adds line numbers, copy button, scrollability, code block features
 * Helper Attribute: [x-behavior="pre"]
 */
export function pre(element, options = {}) {
  if (element.tagName !== 'PRE') {
    console.warn('[pre] Element must be a <pre>');
    return () => {};
  }

  // Idempotency check
  if (element.classList.contains('x-pre') || element.closest('.x-pre-wrapper')) {
    return () => {};
  }

  // Try to infer language from child code element if not set on pre
  const codeChild = element.querySelector('code');
  const childLanguage = codeChild ? (codeChild.dataset.language || '') : '';

  const scrollable = options.scrollable ?? (element.dataset.scrollable === 'true');
  // Code blocks should read like a code editor: DO NOT wrap by default (wrapping
  // breaks tokens mid-word, e.g. "wb-btn--" / "sm"). Long lines scroll
  // horizontally instead. Opt into wrapping explicitly with data-wrap="true". (#199)
  const defaultWrap = false;

  const config = {
    language: options.language || element.dataset.language || childLanguage || '',
    // v3 default: ON, matching an actual code editor (VS Code shows line
    // numbers by default) — explicit show-line-numbers="false" opts out.
    showLineNumbers: options.showLineNumbers ?? (element.getAttribute('show-line-numbers') !== 'false'),
    showCopy: options.showCopy ?? (element.hasAttribute('data-show-copy') || element.hasAttribute('data-copy')),
    maxHeight: options.maxHeight || element.dataset.maxHeight || '',
    // v3: plain `wrap` attribute is canonical; data-wrap accepted for back-compat.
    wrap: options.wrap ?? (element.hasAttribute('wrap')
      ? element.getAttribute('wrap') !== 'false'
      : (element.hasAttribute('data-wrap') ? element.dataset.wrap !== 'false' : defaultWrap)),
    scrollable: scrollable,
    size: options.size || element.dataset.size || 'md',
    ...options
  };

  // Size mappings - 1rem (md) is the readable default per the font-size
  // standard; smaller/larger only when data-size is set explicitly.
  const sizeMap = {
    xs: '0.875rem',
    sm: '0.9375rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem'
  };
  const fontSize = sizeMap[config.size] || sizeMap.md;

  element.classList.add('x-pre');

  // Base styling - ensure no overflow
  Object.assign(element.style, {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: fontSize,
    padding: (config.showCopy || config.language) ? '1.5rem 0.75rem 0.75rem 0.75rem' : '0.75rem',
    borderRadius: '0', // Wrapper handles radius
    backgroundColor: 'transparent', // Wrapper handles bg
    color: 'var(--text-code, #d4d4d4)',
    border: 'none', // Wrapper handles border
    // No-wrap code scrolls horizontally (editor style); wrapped code hides overflow.
    overflowX: config.wrap ? 'hidden' : 'auto',
    overflowY: config.maxHeight ? 'auto' : 'hidden',
    whiteSpace: config.wrap ? 'pre-wrap' : 'pre',
    // Only break words when wrapping — never mangle tokens in editor (pre) mode.
    wordBreak: config.wrap ? 'break-word' : 'normal',
    overflowWrap: config.wrap ? 'break-word' : 'normal',
    margin: '0',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  });

  if (config.maxHeight) {
    element.style.maxHeight = config.maxHeight;
  }

  let wrapper = null;
  let copyButton = null;
  let languageBadge = null;
  let lineNumbersEl = null;

  // Always wrap to provide the container look
  wrapper = document.createElement('div');
  wrapper.className = 'x-pre-wrapper';
  wrapper.style.cssText = `
    position: relative;
    display: block;
    background-color: var(--bg-code, #1e1e1e);
    border: 1px solid var(--border-color, #374151);
    border-radius: var(--radius-md, 6px);
    margin-bottom: 1rem;
    overflow: hidden; /* Ensure rounded corners clip content */
  `;

  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  // Add copy button
  if (config.showCopy) {
    copyButton = document.createElement('button');
    copyButton.className = 'x-pre__copy';
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
      z-index: 10;
      opacity: 0.6;
    `;

    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.backgroundColor = 'var(--bg-tertiary, #374151)';
      copyButton.style.opacity = '1';
    });

    copyButton.addEventListener('mouseleave', () => {
      copyButton.style.backgroundColor = 'var(--bg-secondary, #1f2937)';
      copyButton.style.opacity = '0.7';
    });

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(element.textContent);
        copyButton.textContent = '✓';
        setTimeout(() => {
          copyButton.textContent = '📋';
        }, 2000);
      } catch (err) {
        console.error('[pre] Failed to copy:', err);
      }
    });

    wrapper.appendChild(copyButton);
  }

  // Add language badge
  if (config.language) {
    const langMap = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'py': 'Python',
      'python': 'Python',
      'json': 'JSON',
      'bash': 'Bash',
      'sh': 'Shell',
      'md': 'Markdown',
      'markdown': 'Markdown'
    };
    const displayText = langMap[config.language.toLowerCase()] || config.language;

    languageBadge = document.createElement('span');
    languageBadge.className = 'x-pre__language';
    languageBadge.textContent = displayText;
    
    // Position to the left of copy button if it exists
    const rightPos = config.showCopy ? '3rem' : '0.5rem';

    languageBadge.style.cssText = `
      position: absolute;
      top: 0.25rem;
      right: ${rightPos};
      background: transparent;
      color: var(--text-tertiary, #9ca3af);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 9;
      pointer-events: none;
      opacity: 0.5;
    `;
    
    // If copy button exists, we might overlap.
    // Let's move copy button to the left of the badge?
    // Or make the badge disappear when hovering?
    // Or put the badge at the bottom right?
    // "javascript tag must be inside he elememt 1rem from the edge"
    // I'll put it top-right.
    // I'll move the copy button to be slightly offset or only show on hover (which I did).
    // When copy button shows, it might cover the badge. That's acceptable.
    
    wrapper.appendChild(languageBadge);
  }

  // Show/hide toggle — collapses the code content down to just the header
  // row (badge/copy/toggle, all absolute-positioned siblings of <pre> inside
  // wrapper) so the block can be tucked away without losing the ability to
  // bring it back. wrapper gets an explicit min-height because these header
  // controls are absolutely positioned and contribute nothing to wrapper's
  // own height — without it, hiding <pre> would collapse wrapper to 0px and
  // clip the very controls needed to re-expand it.
  let collapsed = false;
  const usedSlots = (config.showCopy ? 1 : 0) + (config.language ? 1 : 0);
  const toggleRight = usedSlots === 0 ? 0.5 : usedSlots === 1 ? 3 : 5.5;

  const toggleButton = document.createElement('button');
  toggleButton.className = 'x-pre__toggle';
  toggleButton.textContent = '⏷';
  toggleButton.title = 'Hide code';
  toggleButton.style.cssText = `
    position: absolute;
    top: 0.25rem;
    right: ${toggleRight}rem;
    background: var(--bg-secondary, #1f2937);
    border: 1px solid var(--border-color, #374151);
    color: var(--text-secondary, #9ca3af);
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-sm, 3px);
    cursor: pointer;
    font-size: 0.7rem;
    line-height: 1;
    z-index: 11;
  `;
  toggleButton.addEventListener('click', () => {
    collapsed = !collapsed;
    element.style.display = collapsed ? 'none' : '';
    if (lineNumbersEl) lineNumbersEl.style.display = collapsed ? 'none' : '';
    toggleButton.textContent = collapsed ? '⏵' : '⏷';
    toggleButton.title = collapsed ? 'Show code' : 'Hide code';
  });
  wrapper.appendChild(toggleButton);
  wrapper.style.minHeight = '2.5rem';

  // Add line numbers
  if (config.showLineNumbers) {
    // Fix: Remove leading newline from code content if present to ensure line numbers align
    // This handles the common case of <pre><code>\n...</code></pre>
    if (codeChild && codeChild.firstChild && codeChild.firstChild.nodeType === 3) {
      if (codeChild.firstChild.nodeValue.startsWith('\n')) {
        codeChild.firstChild.nodeValue = codeChild.firstChild.nodeValue.substring(1);
      }
    } else if (element.firstChild && element.firstChild.nodeType === 3) {
      if (element.firstChild.nodeValue.startsWith('\n')) {
        element.firstChild.nodeValue = element.firstChild.nodeValue.substring(1);
      }
    }

    const lines = element.textContent.split('\n');
    // Remove last empty line if it exists (common in pre)
    if (lines[lines.length - 1] === '') lines.pop();

    const topPadding = (config.showCopy || config.language) ? '2rem' : '1rem';

    lineNumbersEl = document.createElement('div');
    lineNumbersEl.className = 'x-pre__line-numbers';
    lineNumbersEl.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      padding-top: ${topPadding};
      background: var(--bg-secondary, rgba(0,0,0,0.2));
      color: var(--text-tertiary, #6b7280);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      /* Must match the code's OWN font-size (not a hardcoded value) — with
         line-height as a unitless multiplier, two different font-sizes at
         the same 1.5 ratio produce different actual pixel line-heights, so
         line numbers drift out of alignment with their code lines. */
      font-size: ${fontSize};
      line-height: 1.5; /* Must match code line-height */
      text-align: right;
      user-select: none;
      border-right: 1px solid var(--border-color, #374151);
      width: 2rem;
      min-width: 2rem;
      box-sizing: border-box;
      z-index: 1;
    `;

    // Each number is individually positioned (not stacked via flex/uniform
    // row height) because when code WRAPS (§6 — wrap, never h-scroll), one
    // LOGICAL line can span multiple VISUAL rows, growing that line's own
    // height beyond the fixed line-height every other row assumes. A plain
    // stacked list of numbers has no way to know a given line grew, so every
    // number after the first wrapped line drifts out of sync with its actual
    // code line. Each number's real position is measured directly against
    // the rendered text instead.
    const lineNumEls = lines.map((_, index) => {
      const lineNum = document.createElement('div');
      lineNum.textContent = index + 1;
      lineNum.style.position = 'absolute';
      lineNum.style.right = '0.25rem';
      lineNumbersEl.appendChild(lineNum);
      return lineNum;
    });

    wrapper.insertBefore(lineNumbersEl, element);
    element.style.paddingLeft = '2.5rem'; // 2rem width + 0.5rem padding

    // Ensure line height matches
    element.style.lineHeight = '1.5';

    // Measure each logical line's actual rendered top (relative to the code
    // element) and position its number to match. Deferred via double-rAF so
    // this runs after the browser has laid out any wrapped text AND after
    // the child <code>'s own behavior (syntax highlighting) has run — both
    // can still be pending in the same tick this behavior runs in.
    const measureAndPosition = () => {
      const target = codeChild || element;
      // Container top is the <pre>'s OWN border-box edge, which INCLUDES its
      // padding-top (1rem/1.5rem/2rem depending on badge/copy). Line 1's
      // number must be measured the same way as every other line — via the
      // first text node's real start position — not hardcoded to 0px, or it
      // sits above the padding, misaligned with where the first code line
      // actually paints.
      const containerTop = element.getBoundingClientRect().top;
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      let node;
      let lineIndex = 0;
      const firstTextNode = walker.nextNode();
      if (firstTextNode && lineNumEls[0]) {
        const startRange = document.createRange();
        startRange.setStart(firstTextNode, 0);
        startRange.setEnd(firstTextNode, 0);
        const startRect = startRange.getClientRects()[0];
        if (startRect) {
          lineNumEls[0].style.top = (startRect.top - containerTop) + 'px';
        }
      }
      node = firstTextNode;
      while (node) {
        const text = node.nodeValue;
        let searchFrom = 0;
        let nlAt;
        while ((nlAt = text.indexOf('\n', searchFrom)) !== -1) {
          lineIndex++;
          if (lineIndex < lineNumEls.length) {
            const range = document.createRange();
            // Position at the first character AFTER this newline, if there is
            // one in this same text node; otherwise at the newline itself
            // (still the correct start-of-line row).
            const offset = Math.min(nlAt + 1, text.length);
            range.setStart(node, offset);
            range.setEnd(node, offset);
            const rect = range.getClientRects()[0];
            if (rect) {
              lineNumEls[lineIndex].style.top = (rect.top - containerTop) + 'px';
            }
          }
          searchFrom = nlAt + 1;
        }
        node = walker.nextNode();
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(measureAndPosition));

    // Wrapping (and therefore each line's height) depends on the container's
    // width — re-measure whenever it changes (responsive layout, sidebar
    // toggle, window resize).
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => measureAndPosition());
      ro.observe(element);
    }
  }

  return () => {
    element.classList.remove('x-pre');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default { pre };
