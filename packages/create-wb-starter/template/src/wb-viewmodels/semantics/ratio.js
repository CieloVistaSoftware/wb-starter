/**
 * Ratio - Aspect ratio container
 * Custom Tag: <div x-ratio>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 *
 * #779: the 16/9 default and the media fill are ratio.css; only an author's
 * other ratio travels, as a generated stylesheet rule -- never element.style.
 */
import { setRule, clearRules } from '../../core/dynamic-style.js';

export function ratio(element, options = {}) {
  const config = {
    ratio: options.ratio || element.getAttribute('ratio') || '16x9',
    ...options
  };

  element.classList.add('x-ratio');

  // Convert 16x9 to 16/9 for CSS
  const cssRatio = config.ratio.replace('x', '/').replace(':', '/');
  if (cssRatio !== '16/9') setRule(element, 'ratio', { aspectRatio: cssRatio });

  // Ensure children cover the area — only for a direct media child or iframe.
  const child = element.querySelector('iframe, embed, video, img, object');
  if (child) child.classList.add('x-ratio__media');

  return () => {
    element.classList.remove('x-ratio');
    if (child) child.classList.remove('x-ratio__media');
    clearRules(element);
  };
}

export default { ratio };
