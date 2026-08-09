/**
 * Vimeo - Vimeo embed
 * Custom Tag: <wb-vimeo>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 *
 * Fixed a real bug found during the migration: media.js's version created
 * `videoIframe` via document.createElement('iframe') but then referenced
 * an undefined `iframe`/`params` (never declared — only `videoIframe`/
 * `embedParams` existed) — this threw a ReferenceError the instant
 * <wb-vimeo> was ever used. Completely broken, apparently never actually
 * exercised live.
 */
export function vimeo(element, options = {}) {
  const config = {
    id: options.id || element.getAttribute('video-id'),
    autoplay: options.autoplay ?? (element.hasAttribute('autoplay') || element.hasAttribute('data-autoplay')),
    muted: options.muted ?? (element.hasAttribute('muted') || element.hasAttribute('data-muted')),
    loop: options.loop ?? (element.hasAttribute('loop') || element.hasAttribute('data-loop')),
    ...options
  };

  if (!config.id) {
    console.warn('[WB Vimeo] No video ID provided');
    return;
  }

  element.classList.add('wb-vimeo');
  element.style.aspectRatio = '16/9';
  element.style.width = '100%';
  element.style.background = '#000';
  element.style.borderRadius = '8px';
  element.style.overflow = 'hidden';

  const params = new URLSearchParams({
    autoplay: config.autoplay ? '1' : '0',
    muted: config.muted ? '1' : '0',
    loop: config.loop ? '1' : '0'
  });

  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${config.id}?${params}`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';

  element.innerHTML = '';
  element.appendChild(iframe);

  return () => element.classList.remove('wb-vimeo');
}

export default { vimeo };
