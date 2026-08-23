import { readFlag } from '../../core/read-attr.js';
/**
 * Video - Enhanced video player
 * Custom Tag: <wb-video>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...). This
 * file already existed with a nicer wbVideo API (getTime/getDuration/
 * setVolume/getVolume/mute/toggleMute) but the same missing-bare-attribute-
 * fallback bug and no handling of <wb-video> as a non-native custom tag —
 * merged the two: media.js's correct config reads + custom-tag wrapping
 * (a <wb-video> isn't a real <video>, so controls/autoplay/etc. must be
 * set on a real <video> child, not the host), this file's fuller API.
 */
import { attachVideoLoadRetry } from '../media-load-retry.js';

export function video(element, options = {}) {
  const config = {
    src: options.src || element.getAttribute('src') || '',
    controls: options.controls ?? element.getAttribute('controls') !== 'false',
    autoplay: options.autoplay ?? (element.hasAttribute('autoplay') || readFlag(element, 'autoplay')),
    muted: options.muted ?? (element.hasAttribute('muted') || readFlag(element, 'muted')),
    loop: options.loop ?? (element.hasAttribute('loop') || readFlag(element, 'loop')),
    poster: options.poster || element.getAttribute('poster') || '',
    playsinline: options.playsinline ?? element.getAttribute('playsinline') !== 'false',
    ...options
  };

  element.classList.add('wb-video');
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', 'Video Player');

  let videoEl = element;
  if (element.tagName !== 'VIDEO') {
    element.innerHTML = '';
    videoEl = document.createElement('video');
    videoEl.style.width = '100%';
    if (config.src) videoEl.src = config.src;
    element.appendChild(videoEl);
  }

  if (config.controls) videoEl.controls = true;
  if (config.autoplay) videoEl.autoplay = true;
  if (config.muted) videoEl.muted = true;
  if (config.loop) videoEl.loop = true;
  if (config.poster) videoEl.poster = config.poster;
  if (config.playsinline) videoEl.playsInline = true;

  const retryCleanup = config.src ? attachVideoLoadRetry(videoEl) : null;

  element.wbVideo = {
    play: () => videoEl.play(),
    pause: () => videoEl.pause(),
    toggle: () => videoEl.paused ? videoEl.play() : videoEl.pause(),
    setTime: (t) => { videoEl.currentTime = t; },
    getTime: () => videoEl.currentTime,
    getDuration: () => videoEl.duration,
    setVolume: (v) => { videoEl.volume = Math.max(0, Math.min(1, v)); },
    getVolume: () => videoEl.volume,
    // #782: mute() / unmute() / toggleMute() were three members for one
    // boolean. The canonical verb set has no `mute`, and a typed setter says
    // the same thing once: setMuted(true), setMuted(false), or
    // setMuted(!getMuted()) for the toggle.
    setMuted: (muted) => { videoEl.muted = !!muted; },
    getMuted: () => videoEl.muted
  };

  return () => { element.classList.remove('wb-video'); if (retryCleanup) retryCleanup(); };
}

export default { video };
