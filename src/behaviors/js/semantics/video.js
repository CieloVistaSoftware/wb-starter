/**
 * Video - Enhanced <video> element
 * Adds controls, autoplay, loop, poster support
 */
export function video(element, options = {}) {
  const config = {
    controls: options.controls ?? element.dataset.controls !== 'false',
    autoplay: options.autoplay ?? element.hasAttribute('data-autoplay'),
    muted: options.muted ?? element.hasAttribute('data-muted'),
    loop: options.loop ?? element.hasAttribute('data-loop'),
    poster: options.poster || element.dataset.poster || '',
    playsinline: options.playsinline ?? element.dataset.playsinline !== 'false',
    ...options
  };

  element.classList.add('wb-video');
  if (config.controls) element.controls = true;
  if (config.autoplay) element.autoplay = true;
  if (config.muted) element.muted = true;
  if (config.loop) element.loop = true;
  if (config.poster) element.poster = config.poster;
  if (config.playsinline) element.playsInline = true;

  // API
  element.wbVideo = {
    play: () => element.play(),
    pause: () => element.pause(),
    toggle: () => element.paused ? element.play() : element.pause(),
    setTime: (t) => { element.currentTime = t; },
    getTime: () => element.currentTime,
    getDuration: () => element.duration,
    setVolume: (v) => { element.volume = Math.max(0, Math.min(1, v)); },
    getVolume: () => element.volume,
    mute: () => { element.muted = true; },
    unmute: () => { element.muted = false; },
    toggleMute: () => { element.muted = !element.muted; }
  };

  element.dataset.wbReady = 'video';
  return () => element.classList.remove('wb-video');
}

export default { video };
