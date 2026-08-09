/**
 * Ratio - Aspect ratio container
 * Custom Tag: <wb-ratio>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */
export function ratio(element, options = {}) {
  const config = {
    ratio: options.ratio || element.getAttribute('ratio') || '16x9',
    ...options
  };

  element.classList.add('wb-ratio');

  // Convert 16x9 to 16/9 for CSS
  const cssRatio = config.ratio.replace('x', '/').replace(':', '/');
  element.style.aspectRatio = cssRatio;

  // Ensure children cover the area — only for a direct media child or iframe.
  const child = element.querySelector('iframe, embed, video, img, object');
  if (child) {
    child.style.width = '100%';
    child.style.height = '100%';
    child.style.objectFit = 'cover';
  }

  return () => {
    element.classList.remove('wb-ratio');
    element.style.aspectRatio = '';
  };
}

export default { ratio };
