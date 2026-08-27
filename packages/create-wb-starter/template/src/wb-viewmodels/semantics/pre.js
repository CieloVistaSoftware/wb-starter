import { readFlag, readAttr } from '../../core/read-attr.js';
import { writeToClipboard } from '../copy.js';

/**
 * Pre - Enhanced <pre> element (Preformatted Text)
 * Adds line numbers, copy button, scrollability, code block features
 * Helper Attribute: [x-behavior="pre"]
 *
 * The copy control below is a header row item positioned alongside the
 * language badge and hide/show toggle inside this behavior's OWN
 * .x-pre-wrapper (see the "Header controls" measurement block) -- it is not
 * built via x-copybutton's separate .x-copybutton-wrapper, since that would
 * nest a second relative/absolute positioning context inside this one and
 * break the sequential right-offset measurement every other header control
 * here depends on. It DOES reuse x-copybutton's/x-copy's shared
 * writeToClipboard() (../copy.js) for the actual clipboard write + fallback,
 * so that logic exists in exactly one place project-wide (#291).
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
  const childLanguage = codeChild ? (codeChild.getAttribute('language') || readAttr(codeChild, 'language') || '') : '';

  // v3: plain `scrollable` attribute is canonical; data-scrollable accepted for back-compat.
  const scrollable = options.scrollable ?? (element.getAttribute('scrollable') === 'true' || readAttr(element, 'scrollable') === 'true');
  // Code blocks should read like a code editor: DO NOT wrap by default (wrapping
  // breaks tokens mid-word, e.g. "x-btn--" / "sm"). Long lines scroll
  // horizontally instead. Opt into wrapping explicitly with wrap="true". (#199)
  const defaultWrap = false;

  const config = {
    // v3: plain `language` attribute is canonical; data-language accepted for back-compat.
    language: options.language || element.getAttribute('language') || readAttr(element, 'language') || childLanguage || '',
    // v3 default: ON, matching an actual code editor (VS Code shows line
    // numbers by default) — explicit show-line-numbers="false" opts out.
    showLineNumbers: options.showLineNumbers ?? (element.getAttribute('show-line-numbers') !== 'false'),
    showCopy: options.showCopy ?? (element.hasAttribute('show-copy') || readFlag(element, 'show-copy') || readFlag(element, 'copy')),
    maxHeight: options.maxHeight || element.getAttribute('max-height') || readAttr(element, 'maxHeight') || '',
    // v3: plain `wrap` attribute is canonical; data-wrap accepted for back-compat.
    wrap: options.wrap ?? (element.hasAttribute('wrap')
      ? element.getAttribute('wrap') !== 'false'
      : (readFlag(element, 'wrap') ? readAttr(element, 'wrap') !== 'false' : defaultWrap)),
    scrollable: scrollable,
    // v3: plain `size` attribute is canonical; data-size accepted for back-compat.
    size: options.size || element.getAttribute('size') || readAttr(element, 'size') || 'md',
    ...options
  };

  // Size classes carry font-size (src/styles/behaviors/pre.css) — 'md' (1rem)
  // is the readable default per the font-size standard.
  const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  const size = validSizes.includes(config.size) ? config.size : 'md';

  element.classList.add('x-pre', `x-pre--${size}`);
  if (config.showCopy || config.language) element.classList.add('x-pre--has-header');
  if (config.wrap) element.classList.add('x-pre--wrap');
  if (config.maxHeight) {
    element.classList.add('x-pre--has-max-height');
    // The value itself (e.g. "400px") is arbitrary user input — genuinely
    // per-instance, can't be a class.
    element.style.maxHeight = config.maxHeight;
  }

  let wrapper = null;
  let copyButton = null;
  let languageBadge = null;
  let lineNumbersEl = null;

  // Always wrap to provide the container look
  wrapper = document.createElement('div');
  wrapper.className = 'x-pre-wrapper';

  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  // Header controls (copy button, language badge, toggle) are positioned
  // right-to-left with a guaranteed >=1rem gap between any two of them —
  // hardcoded rem offsets (the previous approach) don't account for the
  // language badge's actual rendered width, which varies with the label
  // text ("HTML" vs "JavaScript" vs "TypeScript"). Reported live: the
  // toggle button's edge was overlapping the badge by ~10px, not just
  // "too close." Each control is measured after being appended and the
  // NEXT control (further left) is positioned from its real width, not a
  // guess.
  const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const GAP_PX = rootFontSizePx; // 1rem minimum gap between any two controls
  const EDGE_OFFSET_PX = 0.25 * rootFontSizePx;
  let nextControlRightPx = EDGE_OFFSET_PX;

  // Add copy button
  if (config.showCopy) {
    copyButton = document.createElement('button');
    copyButton.className = 'x-pre__copy';
    copyButton.textContent = '📋';
    copyButton.title = 'Copy code';

    // right offset is genuinely per-instance — depends on which OTHER
    // controls are present and their real rendered widths (see comment
    // above); hover state is handled by .x-pre__copy:hover in pre.css now.
    copyButton.style.right = `${nextControlRightPx}px`;

    copyButton.addEventListener('click', async () => {
      const ok = await writeToClipboard(element.textContent);
      if (ok) {
        copyButton.textContent = '✓';
        setTimeout(() => {
          copyButton.textContent = '📋';
        }, 2000);
      }
    });

    wrapper.appendChild(copyButton);
    nextControlRightPx += copyButton.getBoundingClientRect().width + GAP_PX;
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

    // right offset is genuinely per-instance (see copy button comment above).
    languageBadge.style.right = `${nextControlRightPx}px`;

    wrapper.appendChild(languageBadge);
    nextControlRightPx += languageBadge.getBoundingClientRect().width + GAP_PX;
  }

  // Show/hide toggle — collapses the code content down to just the header
  // row (badge/copy/toggle, all absolute-positioned siblings of <pre> inside
  // wrapper) so the block can be tucked away without losing the ability to
  // bring it back. wrapper gets an explicit min-height because these header
  // controls are absolutely positioned and contribute nothing to wrapper's
  // own height — without it, hiding <pre> would collapse wrapper to 0px and
  // clip the very controls needed to re-expand it.
  //
  // Only worth offering when there's actually something to collapse away —
  // gated on maxHeight (the same signal the wrapper itself uses to decide
  // whether the code needs clipping). Previously unconditional: every
  // <div x-demo> code sample (typically 3-10 lines, never maxHeight) got a
  // "hide code" toggle with nothing meaningful to hide.
  let collapsed = false;

  if (config.maxHeight) {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'x-pre__toggle';
    toggleButton.textContent = '⏷';
    toggleButton.title = 'Hide code';
    // right offset is genuinely per-instance (see copy button comment above).
    // min-height for the collapsed state lives on .x-pre-wrapper in pre.css.
    toggleButton.style.right = `${nextControlRightPx}px`;
    toggleButton.addEventListener('click', () => {
      collapsed = !collapsed;
      element.style.display = collapsed ? 'none' : '';
      if (lineNumbersEl) lineNumbersEl.style.display = collapsed ? 'none' : '';
      toggleButton.textContent = collapsed ? '⏵' : '⏷';
      toggleButton.title = collapsed ? 'Show code' : 'Hide code';
    });
    wrapper.appendChild(toggleButton);
  }

  // Add line numbers
  if (config.showLineNumbers) {
    // padding-left + line-height for the gutter live on .x-pre--has-line-numbers.
    element.classList.add('x-pre--has-line-numbers');
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

    lineNumbersEl = document.createElement('div');
    // Must track the pre's own size class (x-pre--${size}) so font-size
    // matches — a mismatched font-size at the same 1.5 line-height ratio
    // produces different actual pixel line-heights, drifting the numbers
    // out of alignment with their code lines. has-header mirrors .x-pre's
    // own header padding for the same reason.
    lineNumbersEl.className = `x-pre__line-numbers x-pre__line-numbers--${size}`;
    if (config.showCopy || config.language) {
      lineNumbersEl.classList.add('x-pre__line-numbers--has-header');
    }

    // Each number is individually positioned (not stacked via flex/uniform
    // row height) because when code WRAPS (§6 — wrap, never h-scroll), one
    // LOGICAL line can span multiple VISUAL rows, growing that line's own
    // height beyond the fixed line-height every other row assumes. A plain
    // stacked list of numbers has no way to know a given line grew, so every
    // number after the first wrapped line drifts out of sync with its actual
    // code line. Each number's real position is measured directly against
    // the rendered text instead — position/right come from the
    // `.x-pre__line-numbers > div` rule in pre.css, only `top` (below) is
    // genuinely per-instance.
    const lineNumEls = lines.map((_, index) => {
      const lineNum = document.createElement('div');
      lineNum.textContent = index + 1;
      lineNumbersEl.appendChild(lineNum);
      return lineNum;
    });

    wrapper.insertBefore(lineNumbersEl, element);

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

      // Collect every text node up front so a failed measurement can fall
      // forward into a later one (see measureFrom below).
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) textNodes.push(n);

      // Syntax-highlighted code interleaves plain text with <span> wrappers
      // (hljs-tag, hljs-attr, etc.), so a line's ending "\n" is very often
      // the LAST character of its text node, immediately followed by a new
      // span starting the next token. A COLLAPSED range positioned at that
      // exact end-of-node boundary unreliably returns an empty
      // getClientRects() in that case — there's no character left in THIS
      // node to anchor to — silently leaving that line's number never
      // positioned (it then defaults to piling up near the top of the
      // gutter, on top of line 1 — reported live as "the topmost number
      // seems to be overwritten"). Use a 1-character (non-collapsed) range
      // when the node has one available at this offset; when it doesn't,
      // fall forward to the start of the next text node instead, which is
      // guaranteed to have real content to measure against.
      const measureFrom = (nodeIndex, offset) => {
        while (nodeIndex < textNodes.length) {
          const node = textNodes[nodeIndex];
          const len = node.nodeValue.length;
          if (offset < len) {
            const range = document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset + 1);
            const rect = range.getClientRects()[0];
            if (rect) return rect;
          }
          nodeIndex++;
          offset = 0;
        }
        return null;
      };

      // #559: a line's number must sit next to where its VISIBLE content
      // starts, not necessarily its very first character. When wrapping is
      // enabled (doc-viewer's forced pre-wrap, mdhtml.css) and a line opens
      // with indentation whitespace (e.g. "  src=...") whose available row
      // width is narrow (a long wrapped attribute value + enlarged
      // font-size both shrink it), that leading run of spaces can itself
      // soft-wrap onto its own visual row, landing the number next to an
      // empty-looking row while the real text ("src=...") starts one row
      // below with no number of its own -- reads as a phantom blank line.
      // Skip past leading spaces/tabs (never past a real newline -- an
      // all-whitespace/blank source line has nothing better to anchor to)
      // so the measured position always lands on real content when there
      // is any. Confirmed live: without this, docs/behaviors/semantics/
      // audio.md's "With Bass/Treble Boost" sample (long src="https://…"
      // attribute) showed exactly this at a narrow effective row width.
      const firstContentOffset = (nodeIndex, offset) => {
        while (nodeIndex < textNodes.length) {
          const text = textNodes[nodeIndex].nodeValue;
          while (offset < text.length) {
            const ch = text[offset];
            if (ch === '\n') return { nodeIndex, offset }; // blank line
            if (ch !== ' ' && ch !== '\t') return { nodeIndex, offset };
            offset++;
          }
          nodeIndex++;
          offset = 0;
        }
        return { nodeIndex, offset };
      };

      if (textNodes[0] && lineNumEls[0]) {
        const pos = firstContentOffset(0, 0);
        const rect = measureFrom(pos.nodeIndex, pos.offset);
        if (rect) lineNumEls[0].style.top = (rect.top - containerTop) + 'px';
      }

      let lineIndex = 0;
      for (let i = 0; i < textNodes.length; i++) {
        const text = textNodes[i].nodeValue;
        let searchFrom = 0;
        let nlAt;
        while ((nlAt = text.indexOf('\n', searchFrom)) !== -1) {
          lineIndex++;
          if (lineIndex < lineNumEls.length) {
            const pos = firstContentOffset(i, nlAt + 1);
            const rect = measureFrom(pos.nodeIndex, pos.offset);
            if (rect) lineNumEls[lineIndex].style.top = (rect.top - containerTop) + 'px';
          }
          searchFrom = nlAt + 1;
        }
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
