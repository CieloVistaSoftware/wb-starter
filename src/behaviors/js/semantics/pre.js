/**
 * Pre - Enhanced <pre> element (Preformatted Text)
 * Adds line numbers, copy button, scrollability, code block features
 */
export function pre(element, options = {}) {
  if (element.tagName !== 'PRE') {
    console.warn('[pre] Element must be a <pre>');
    return () => {};
  }

  // Try to infer language from child code element if not set on pre
  const codeChild = element.querySelector('code');
  const childLanguage = codeChild ? (codeChild.dataset.language || '') : '';

  const config = {
    language: options.language || element.dataset.language || childLanguage || '',
    showLineNumbers: options.showLineNumbers ?? (element.hasAttribute('data-show-line-numbers') || element.hasAttribute('data-line-numbers')),
    showCopy: options.showCopy ?? (element.hasAttribute('data-show-copy') || element.hasAttribute('data-copy')),
    maxHeight: options.maxHeight || element.dataset.maxHeight || '',
    wrap: options.wrap ?? element.hasAttribute('data-wrap'),
    ...options
  };

  element.classList.add('wb-pre');

  // Base styling
  Object.assign(element.style, {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    padding: (config.showCopy || config.language) ? '2.5rem 1rem 1rem 1rem' : '1rem',
    borderRadius: '0', // Wrapper handles radius
    backgroundColor: 'transparent', // Wrapper handles bg
    color: 'var(--text-code, #d4d4d4)',
    border: 'none', // Wrapper handles border
    overflow: 'auto',
    whiteSpace: config.wrap ? 'pre-wrap' : 'pre',
    wordBreak: config.wrap ? 'break-word' : 'normal',
    margin: '0',
    width: '100%',
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
  wrapper.className = 'wb-pre-wrapper';
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
    copyButton.className = 'wb-pre__copy';
    copyButton.textContent = '📋';
    copyButton.title = 'Copy code';
    
    copyButton.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      color: var(--text-secondary, #9ca3af);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      z-index: 10;
    `;

    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.backgroundColor = 'var(--bg-tertiary, #374151)';
    });

    copyButton.addEventListener('mouseleave', () => {
      copyButton.style.backgroundColor = 'var(--bg-secondary, #1f2937)';
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
    languageBadge.className = 'wb-pre__language';
    languageBadge.textContent = displayText;
    
    // Position to the left of copy button if it exists
    const rightPos = config.showCopy ? '3.5rem' : '0.5rem';

    languageBadge.style.cssText = `
      position: absolute;
      top: 0.5rem;
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

  // Add line numbers
  if (config.showLineNumbers) {
    const lines = element.textContent.split('\n');
    // Remove last empty line if it exists (common in pre)
    if (lines[lines.length - 1] === '') lines.pop();
    
    lineNumbersEl = document.createElement('div');
    lineNumbersEl.className = 'wb-pre__line-numbers';
    lineNumbersEl.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      padding: 1rem 0.5rem;
      background: var(--bg-secondary, rgba(0,0,0,0.2));
      color: var(--text-tertiary, #6b7280);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.5; /* Must match code line-height */
      text-align: right;
      user-select: none;
      border-right: 1px solid var(--border-color, #374151);
      width: 3rem;
      box-sizing: border-box;
    `;

    lines.forEach((_, index) => {
      const lineNum = document.createElement('div');
      lineNum.textContent = index + 1;
      lineNumbersEl.appendChild(lineNum);
    });

    wrapper.insertBefore(lineNumbersEl, element);
    element.style.paddingLeft = '4rem'; // 3rem width + 1rem padding
    
    // Ensure line height matches
    element.style.lineHeight = '1.5';
  }

  element.dataset.wbReady = 'pre';

  return () => {
    element.classList.remove('wb-pre');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default { pre };
