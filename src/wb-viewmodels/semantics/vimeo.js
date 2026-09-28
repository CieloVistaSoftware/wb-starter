import { readFlag } from '../../core/read-attr.js';
/**
 * Vimeo - Vimeo embed
 * Custom Tag: <div x-vimeo>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 *
 * Fixed a real bug found during the migration: media.js's version created
 * `videoIframe` via document.createElement('iframe') but then referenced
 * an undefined `iframe`/`params` (never declared — only `videoIframe`/
 * `embedParams` existed) — this threw a ReferenceError the instant
 * <div x-vimeo> was ever used. Completely broken, apparently never actually
 * exercised live.
 */
export function vimeo(element, options = {}) {
  const config = {
    id: options.id || element.getAttribute('video-id'),
    autoplay: options.autoplay ?? (element.hasAttribute('autoplay') || readFlag(element, 'autoplay')),
    muted: options.muted ?? (element.hasAttribute('muted') || readFlag(element, 'muted')),
    loop: options.loop ?? (element.hasAttribute('loop') || readFlag(element, 'loop')),
    ...options
  };

  if (!config.id) {
    console.warn('[WB Vimeo] No video ID provided');
    return;
  }

  // The host's frame (16:9, black, rounded) is .x-vimeo in embed.css (#779).
  element.classList.add('x-vimeo');

  const params = new URLSearchParams({
    autoplay: config.autoplay ? '1' : '0',
    muted: config.muted ? '1' : '0',
    loop: config.loop ? '1' : '0'
  });

  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${config.id}?${params}`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  // Sized by `.x-vimeo > iframe` in embed.css (#779).

  element.innerHTML = '';
  element.appendChild(iframe);

  return () => element.classList.remove('x-vimeo');
}

export default { vimeo };
