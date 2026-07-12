/**
 * YouTube - YouTube embed
 * Custom Tag: <wb-youtube>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */

/**
 * Extract an 11-char YouTube video ID from any real-world URL shape:
 * watch?v=ID (any domain/query position), youtu.be/ID, /embed/ID,
 * youtube-nocookie.com/embed/ID, /v/ID, /e/ID, /shorts/ID, /live/ID, and the
 * query-less /watch/ID path form. Returns null if nothing matches (e.g. the
 * oembed/attribution_link redirect-wrapper formats, which aren't real video
 * pages and aren't worth parsing).
 */
function extractYouTubeId(url) {
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/(?:embed|v|e|shorts|live)\/([\w-]{11})/,
    /\/watch\/([\w-]{11})/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Only one <wb-youtube> video plays at a time: when any player starts,
// every other player on the page is paused. Registered once (module-level),
// using the YouTube iframe postMessage API (requires enablejsapi=1 on each
// embed's src) rather than one listener per instance. Also tracks whichever
// player is currently playing so pressing Home can jump straight to it
// instead of just scrolling to the page top.
let ytSingletonListenerAttached = false;
let currentPlayingYouTubeEl = null;
function ensureSingleYouTubePlayback() {
  if (ytSingletonListenerAttached) return;
  ytSingletonListenerAttached = true;
  window.addEventListener('message', (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    if (data.event !== 'infoDelivery' || !data.info || data.info.playerState !== 1) return; // 1 = playing
    document.querySelectorAll('.wb-youtube iframe').forEach((frame) => {
      if (frame.contentWindow !== e.source) {
        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
      } else {
        currentPlayingYouTubeEl = frame.closest('.wb-youtube');
      }
    });
  });

  // Home jumps to the currently-playing video instead of just the page top —
  // but never inside a text field, where Home should move the caret as usual.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Home') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!currentPlayingYouTubeEl || !currentPlayingYouTubeEl.isConnected) return;
    e.preventDefault();
    currentPlayingYouTubeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function youtube(element, options = {}) {
  const url = options.url || element.getAttribute('url');
  const config = {
    id: options.id || element.getAttribute('video-id') || (url ? extractYouTubeId(url) : null),
    autoplay: options.autoplay ?? element.hasAttribute('autoplay'),
    muted: options.muted ?? element.hasAttribute('muted'),
    loop: options.loop ?? element.hasAttribute('loop'),
    controls: options.controls ?? (element.getAttribute('controls') !== 'false'),
    ...options
  };

  if (!config.id) {
    console.warn('[WB YouTube] No video ID provided' + (url ? ` (couldn't parse url="${url}")` : ''));
    return;
  }

  element.classList.add('wb-youtube');
  element.style.position = 'relative';
  element.style.aspectRatio = '16/9';
  element.style.width = '100%';
  element.style.background = '#000';
  element.style.borderRadius = '8px';
  element.style.overflow = 'hidden';

  // Builds and inserts the real iframe (called either immediately, for
  // autoplay="", or on click of the poster below).
  function embedNow(withAutoplay) {
    const params = new URLSearchParams({
      autoplay: withAutoplay ? '1' : '0',
      mute: config.muted ? '1' : '0',
      loop: config.loop ? '1' : '0',
      controls: config.controls ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1'
    });
    if (config.loop) params.set('playlist', config.id);

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${config.id}?${params}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';

    // The embedded player never broadcasts infoDelivery/onStateChange messages
    // until it's received a "listening" handshake from the parent — enablejsapi=1
    // alone isn't enough. The player's internal app also isn't necessarily ready
    // the instant the outer iframe's `load` fires, so resend a few times over ~3s
    // rather than once (a single early attempt can land before it's listening).
    const sendListening = () => {
      try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: config.id }), '*'); } catch {}
    };
    iframe.addEventListener('load', () => {
      let attempts = 0;
      const timer = setInterval(() => {
        sendListening();
        if (++attempts >= 6) clearInterval(timer);
      }, 500);
    });

    element.innerHTML = '';
    element.appendChild(iframe);
    ensureSingleYouTubePlayback();
  }

  if (config.autoplay) {
    // Nothing was clicked, so there's no focus concern — embed right away.
    embedNow(true);
  } else {
    // A poster in THIS (parent) document, not YouTube's own play button inside
    // the iframe — clicking a real <iframe>'s play button moves keyboard focus
    // INTO that cross-origin frame, and cross-origin frames never forward key
    // events back to the parent, so any page-level shortcut (e.g. Home jumping
    // to the playing video) can never fire again afterward. Clicking this
    // poster instead keeps focus in the parent document and *then* embeds an
    // already-autoplaying iframe (autoplay is allowed here — it's a direct
    // result of the user's own click, a real gesture).
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'wb-youtube__poster';
    poster.setAttribute('aria-label', 'Play video');
    poster.style.cssText = 'all:unset;position:absolute;inset:0;cursor:pointer;display:flex;' +
      `align-items:center;justify-content:center;background:center/cover no-repeat url(https://img.youtube.com/vi/${config.id}/hqdefault.jpg);`;
    poster.innerHTML =
      '<div style="width:68px;height:48px;background:hsl(0 0% 0% / 0.8);border-radius:14px;' +
      'display:flex;align-items:center;justify-content:center;">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>';
    poster.addEventListener('click', () => embedNow(true));
    element.innerHTML = '';
    element.appendChild(poster);
  }

  return () => element.classList.remove('wb-youtube');
}

export default { youtube };
