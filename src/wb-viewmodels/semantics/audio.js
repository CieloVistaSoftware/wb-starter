import { readFlag, readAttr, hasAuthoredAttr } from '../../core/read-attr.js';
import { reportIfThirdPartyMedia } from '../media-unreachable.js';
import { setRule } from '../../core/dynamic-style.js';
/**
 * Audio - Enhanced <audio> element with 15-Band Graphic Equalizer
 * Premium audio player with Web Audio API EQ, presets, and master volume
 * Helper Attribute: [x-audio]
 */

// 15-BAND GRAPHIC EQUALIZER FREQUENCIES (ISO standard)
const EQ_BANDS = [
  { freq: 25,    label: '25' },
  { freq: 40,    label: '40' },
  { freq: 63,    label: '63' },
  { freq: 100,   label: '100' },
  { freq: 160,   label: '160' },
  { freq: 250,   label: '250' },
  { freq: 400,   label: '400' },
  { freq: 630,   label: '630' },
  { freq: 1000,  label: '1K' },
  { freq: 1600,  label: '1.6K' },
  { freq: 2500,  label: '2.5K' },
  { freq: 4000,  label: '4K' },
  { freq: 6300,  label: '6.3K' },
  { freq: 10000, label: '10K' },
  { freq: 16000, label: '16K' }
];

/** How many of the lowest / highest EQ bands `bass` / `treble` drive. */
const BASS_BANDS = 4;
const TREBLE_BANDS = 4;

/** Parse a dB value and clamp it to the EQ slider range (-12..12). */
function clampDb(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(-12, Math.min(12, n)) : 0;
}

export function audio(element, options = {}) {
  // Read plain attributes first (wb-* custom elements), fall back to data-*
  function attr(name) {
    return element.getAttribute(name) ?? element.dataset[name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null;
  }
  // Three-state read: TRUE when present, FALSE when explicitly ="false",
  // undefined when absent (#669). hasAttribute() alone is not enough -- a bare
  // attribute and one set to "false" are both "present", so
  // showplaybutton="false" read as TRUE and the flag could never turn anything
  // off, which is exactly what John saw.
  const triState = (names) => {
    for (const n of names) {
      if (!element.hasAttribute(n)) continue;
      const v = (element.getAttribute(n) || '').trim().toLowerCase();
      return v === 'false' ? false : true;
    }
    return undefined;
  };

  const config = {
    // Standard HTML5 pattern: a src-less <audio> with one or more <source
    // src="..."> children is valid markup the native browser plays fine --
    // the src attribute is just the shorthand for a single source. Fall
    // back to the first <source>'s src before concluding there's nothing
    // to play (confirmed live: demos/autoinject.html's 4 audio players use
    // exactly this <source>-child pattern and threw "no src provided"
    // despite each having a real, working <source src="...">).
    src: options.src || attr('src') || element.querySelector('source[src]')?.getAttribute('src') || '',
    controls: options.controls ?? attr('controls') !== 'false',
    autoplay: options.autoplay ?? (element.hasAttribute('autoplay') || readFlag(element, 'autoplay')),
    loop: options.loop ?? (element.hasAttribute('loop') || readFlag(element, 'loop')),
    // Declared in audio.schema.json ("Start muted") and needed for autoplay,
    // which browsers only allow on a muted element.
    muted: options.muted ?? readFlag(element, 'muted'),
    // Initial bass/treble shelf in dB (-12..12), applied to the low and high
    // EQ bands. Read at init so the config is complete before anything throws.
    bass: clampDb(options.bass ?? readAttr(element, 'bass', '0')),
    treble: clampDb(options.treble ?? readAttr(element, 'treble', '0')),
    volume: parseFloat(options.volume || attr('volume') || '0.8'),
    // #669 -- accept BOTH spellings. audio.schema.json publishes `showEq`,
    // this code only ever read `show-eq`, so the documented name silently did
    // nothing. Plain-first, data- fallback, matching the established pattern.
    showEq: options.showEq ?? (
      hasAuthoredAttr(element, 'showEq') ||
      readFlag(element, 'show-eq') ||
      attr('show-eq') === 'true' || readAttr(element, 'showEq') === 'true'
    ),
    // #669 -- showDisplay and showPlayButton were declared in the schema and
    // read NOWHERE, so <audio showdisplay> did nothing at all (John reported
    // exactly that). They default to TRUE so every existing custom-UI player
    // keeps its display and play button unchanged; setting either explicitly
    // is what now also opts a plain <audio> into the custom transport below.
    showDisplay: options.showDisplay ?? triState(['show-display', 'showdisplay', 'data-show-display']),
    showPlayButton: options.showPlayButton ?? triState(['show-play-button', 'showplaybutton', 'data-show-play-button']),
    // Optional track picker: playlist="url1|Title 1,url2|Title 2,..." (same
    // comma-separated-values convention as x-breadcrumb/x-timeline's `items`).
    // Falls back to the current single static track-name display when absent.
    playlist: (() => {
      const raw = options.playlist || attr('playlist');
      if (!raw) return null;
      return raw.split(',').map((entry) => {
        const [src, title] = entry.split('|');
        return { src: src.trim(), title: (title || src).trim() };
      }).filter((t) => t.src);
    })(),
    ...options
  };

  // A missing src never reaches the native 'error' listener below -- an
  // <audio>/<audio> with no src attribute simply has nothing to load,
  // so the browser never fires 'error' on it. That let a src-less
  // instance build a fully-dressed, silently non-functional player with
  // no visible signal anything was wrong. Fail loud and immediately
  // instead, matching how every other real load failure in this file
  // already throws.
  if (!config.src) {
    throw new Error('x-audio: no src provided -- nothing to play. Add a src attribute.');
  }

  injectAudioStyles();
  // #448: skip the class on a literal <audio> host -- audio.css selects
  // the `x-audio` TAG directly for that case now. Still added for a
  // native <audio> host (autoInject's native.audio entry, tag 'audio' !==
  // 'x-audio'), since audio.css's `.x-audio` rules still select it by
  // class.
  // #775: unconditional. The tag form used to skip this, so a stylesheet
  // could reach <div x-audio> but not <audio> -- the two rendered from
  // different sources and only one was restyleable.
  element.classList.add('x-audio');
  
  // #775 -- the "dark studio" look was written here as inline styles, which
  // beat every stylesheet rule: a page could not resize or restyle a player
  // it owned. Setting height on it did nothing, because 1.25rem of inline
  // padding kept the box tall regardless.
  //
  // Moved verbatim to src/styles/behaviors/audio.css, so the default look is
  // unchanged and a consumer can now override any part of it.

  // Create audio element if needed
  let audioEl = element;
  if (element.tagName !== 'AUDIO') {
    element.innerHTML = '';
    audioEl = document.createElement('audio');
    if (config.showEq) audioEl.crossOrigin = 'anonymous';
    if (config.src) audioEl.src = config.src;
    element.appendChild(audioEl);
  } else if (element.tagName === 'AUDIO' && config.showEq && !audioEl.crossOrigin) {
    // Try to enable CORS for existing elements if EQ is requested
    audioEl.crossOrigin = 'anonymous';
    // Force reload to apply CORS setting
    const currentSrc = audioEl.src;
    if (currentSrc) {
      audioEl.src = '';
      audioEl.src = currentSrc;
    }
  }
  
  if (config.controls) audioEl.controls = true;
  if (config.autoplay) audioEl.autoplay = true;
  if (config.loop) audioEl.loop = true;
  if (config.muted) { audioEl.muted = true; audioEl.defaultMuted = true; }
  audioEl.volume = Math.max(0, Math.min(1, config.volume));

  // #433: surface a real runtime error (caught by the app's global error
  // overlay) when the src fails to load or resolves to no actual content --
  // a 404, a network failure, and a 0-byte/corrupt file all fire the native
  // 'error' event on the media element (a 0-byte file fails to decode,
  // MEDIA_ERR_SRC_NOT_SUPPORTED). Silently doing nothing here previously let
  // broken audio sources ship undetected (confirmed live: several <audio>
  // instances pointed at empty placeholder files).
  //
  // audio() has no cleanup path: a second call on the same host (a lazy
  // rebuild/re-scan re-running behaviors) replaces audioEl via
  // element.innerHTML = '' without detaching this listener from the OLD
  // element first. That old element's in-flight fetch gets torn down by the
  // removal, and a late 'error' event on it (observed live as code 4,
  // DEMUXER_ERROR_COULD_NOT_OPEN -- under concurrent load, never on a real
  // single page visit; the file itself is intact) used to throw a false
  // positive for a source nobody is looking at anymore. Only a still-attached
  // element's error reflects something actually broken on screen.
  // show-eq forces crossOrigin='anonymous' (needed for
  // AudioContext.createMediaElementSource() to read the raw samples). A
  // cross-origin src whose server sends no CORS headers at all (confirmed
  // live: soundhelix.com -- no Access-Control-Allow-Origin on its response)
  // gets its crossorigin-mode fetch blocked outright, breaking PLAYBACK
  // entirely, not just the EQ visualization -- the exact same file plays
  // fine the moment crossOrigin is removed. One retry without crossOrigin
  // keeps the song playable; the EQ just won't have any visible effect on
  // this specific source (a strictly better trade than "nothing plays").
  let corsFallbackTried = false;
  let genericRetryTried = false;
  const onMediaError = () => {
    if (!document.contains(audioEl)) return;
    if (!corsFallbackTried && audioEl.crossOrigin && config.src) {
      corsFallbackTried = true;
      console.warn(`[WB Audio] "${config.src}" failed to load with crossOrigin="anonymous" (likely no CORS support on that server) -- retrying without it. The EQ will have no effect on this source, but playback will work.`);
      audioEl.crossOrigin = null;
      audioEl.removeAttribute('crossorigin');
      audioEl.src = '';
      audioEl.src = config.src;
      return;
    }
    // A single transient network blip (confirmed live: a src whose URL
    // resolves fine via a direct HTTP check -- correct content-type,
    // correct byte length -- still occasionally throws MEDIA_ERR_SRC_NOT_
    // SUPPORTED on first load, no crossOrigin involved) shouldn't
    // permanently brand a genuinely intact source as broken. Same
    // reasoning as the crossOrigin retry above, generalized: one plain
    // reload before giving up, capped so a truly missing/corrupt file
    // still throws instead of retrying forever.
    if (!genericRetryTried && config.src) {
      genericRetryTried = true;
      console.warn(`[WB Audio] "${config.src}" failed to load (transient?) -- retrying once before reporting it broken.`);
      audioEl.src = '';
      audioEl.src = config.src;
      return;
    }
    // #1115: a third-party host being down is not this page's defect. Reported
    // on the element instead (warning + error="unreachable" + event); a
    // same-origin or malformed src still throws below.
    if (reportIfThirdPartyMedia(element, config.src, 'x-audio')) return;
    const mediaError = audioEl.error;
    const reason = mediaError ? `code ${mediaError.code} (${mediaError.message || 'no message'})` : 'unknown';
    throw new Error(`x-audio: failed to load src "${config.src}" -- ${reason}. The file is missing, unreachable, or has no real content (0 bytes).`);
  };
  audioEl.addEventListener('error', onMediaError);
  // An authored <audio> starts fetching the moment it is parsed, and the lazy
  // runtime (#491) only enhances it once it nears the viewport -- so a missing
  // or 0-byte src has often ALREADY failed by the time this listener exists.
  // The 'error' event does not fire twice, so that failure was never seen:
  // the #433 guarantee held only for the <div x-audio> form, which builds its
  // own element here. A media error already on the element is the same event,
  // just early; handle it now.
  if (audioEl.error) onMediaError();

  // Only replace with the custom Marantz transport when the author actually
  // asked for the enhanced UI: the <audio> custom tag (which has nothing
  // native to fall back to), or show-eq (which needs the custom UI to expose
  // the slider controls). A plain native <audio controls> with neither of
  // those was getting unconditionally hidden and replaced here, silently
  // discarding its native controls for demos that wanted to show them.
  // #669: an explicitly requested display or play button is a request for the
  // custom transport. Without this a plain <audio showdisplay> fell straight
  // through to native controls and the flag was inert.
  // #773: explicitly set EITHER way, as config's own comment says. Only `true`
  // opted in, so <audio show-play-button="false"> kept the native controls --
  // whose play button cannot be hidden -- and the option did nothing at all.
  // triState() leaves an unset flag undefined, so plain <audio> is unchanged.
  const needsCustomUI = element.tagName !== 'AUDIO' || config.showEq ||
    config.showDisplay !== undefined || config.showPlayButton !== undefined;
  // Hidden behind the custom UI by a class (audio.css), not display:none on
  // the style attribute (#779).
  if (needsCustomUI && audioEl.tagName === 'AUDIO') {
    audioEl.classList.add('x-audio__native--hidden');
  }

  // Starting gain per EQ band: `bass` lifts/cuts the four lowest bands
  // (25-100 Hz), `treble` the four highest (4K-16K). Flat when neither is set.
  const initialGains = EQ_BANDS.map((_, i) =>
    i < BASS_BANDS ? config.bass : i >= EQ_BANDS.length - TREBLE_BANDS ? config.treble : 0);
  config.initialGains = initialGains;

  // Web Audio API for EQ
  let audioContext = null;
  let sourceNode = null;
  let filters = [];
  let gainNode = null;
  let isInitialized = false;

  function resumeAudioContextIfNeeded() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  const initAudioContext = () => {
    if (isInitialized) return;
    isInitialized = true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      audioContext = new AudioContext();
      sourceNode = audioContext.createMediaElementSource(audioEl);
      
      // Mutate the SAME array in place (never reassign `filters`) — buildEqUI
      // (below) was already handed this exact array object as a parameter,
      // before it had any elements. Reassigning `filters = [...]` here would
      // only repoint the outer variable; buildEqUI's slider handlers close
      // over the ORIGINAL (then-empty) array reference and would keep writing
      // into a dead array forever, silently doing nothing to real playback
      // (#233 — sliders visually moved but had zero audible effect).
      filters.length = 0;
      EQ_BANDS.forEach(band => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.freq;
        filter.Q.value = 1.4;
        filter.gain.value = initialGains[filters.length];
        filters.push(filter);
      });

      gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      
      sourceNode.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      audioEl.addEventListener('play', resumeAudioContextIfNeeded);
      window.addEventListener('click', resumeAudioContextIfNeeded, { once: true });
      window.addEventListener('keydown', resumeAudioContextIfNeeded, { once: true });
    } catch (e) {
      console.warn('[WB Audio] Web Audio API error:', e);
    }
  };

  // Build transport bar (play button + Marantz display) — only for the
  // custom-UI case (see needsCustomUI above); a plain native <audio controls>
  // keeps its own native controls untouched.
  if (needsCustomUI) {
    buildTransportUI(element, audioEl, config);
  }

  // Build EQ UI if enabled
  if (config.showEq) {
    buildEqUI(element, audioEl, config, initAudioContext, filters);
    // Only initialize Web Audio if EQ is enabled
    audioEl.addEventListener('play', initAudioContext, { once: true });
  }

  // API
  element.wbAudio = {
    play: () => audioEl.play(),
    pause: () => audioEl.pause(),
    toggle: () => { if (!audioEl.paused) return audioEl.pause(); const p = audioEl.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); return p; },
    setVolume: (v) => { audioEl.volume = Math.max(0, Math.min(1, v)); },
    setBand: (index, gain) => {
      initAudioContext();
      if (filters[index]) filters[index].gain.value = gain;
    },
    getFilters: () => filters,
    getAudioContext: () => audioContext
  };

  return () => {
    element.classList.remove('x-audio');
    if (audioContext) audioContext.close();
  };
}

/**
 * Where the custom UI may be appended.
 *
 * #669: a native <audio> element's children are FALLBACK CONTENT -- the browser
 * never renders them. Appending the transport/EQ into `element` therefore built
 * a complete, correct UI that was invisible: present in the DOM, computed
 * display:none via its parent, 0x0 on screen. It worked on <audio> (a custom
 * element, whose children do render), which is exactly why DOM-presence checks
 * passed while nothing appeared.
 *
 * For a native <audio>, wrap it once and mount the UI as a SIBLING inside that
 * wrapper. Idempotent: repeated calls reuse the wrapper rather than nesting.
 */
function uiHost(element) {
  if (element.tagName !== 'AUDIO') return element;
  const existing = element.parentElement;
  if (existing && existing.classList.contains('x-audio--host')) return existing;
  const wrapper = element.ownerDocument.createElement('div');
  wrapper.className = 'x-audio x-audio--host';
  element.replaceWith(wrapper);
  wrapper.appendChild(element);
  return wrapper;
}

/**
 * Click handler for a play button: pause if playing, otherwise play. The
 * transport and the master row each carried this (#883).
 */
function togglePlayback(audioEl, playBtn) {
  return () => {
    if (!audioEl.paused) { audioEl.pause(); return; }
    // play() returns a promise that rejects if the source can't load
    // (bad URL / unsupported / CORS). Swallow it so it isn't an unhandled
    // rejection, and surface a readable message + visual hint instead.
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        console.warn('[x-audio] playback failed:', err && err.message);
        playBtn.setAttribute('aria-label', 'Audio source unavailable');
        playBtn.title = 'Audio source unavailable';
      });
    }
  };
}

function buildTransportUI(element, audioEl, config) {
  const transport = document.createElement('div');
  transport.className = 'x-audio__transport';

  // Play/Pause button
  const playBtn = document.createElement('button');
  playBtn.className = 'x-audio__play-btn';
  playBtn.setAttribute('aria-label', 'Play');
  playBtn.innerHTML = '&#9654;'; // ▶
  playBtn.onclick = togglePlayback(audioEl, playBtn);

  audioEl.addEventListener('play', () => {
    playBtn.innerHTML = '&#9646;&#9646;'; // ❚❚
    playBtn.setAttribute('aria-label', 'Pause');
    playBtn.classList.add('x-audio__play-btn--playing');
  });
  audioEl.addEventListener('pause', () => {
    playBtn.innerHTML = '&#9654;'; // ▶
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.classList.remove('x-audio__play-btn--playing');
  });

  // #669: showPlayButton === false hides it. Undefined means "not specified",
  // which keeps the long-standing default of showing it.
  if (config.showPlayButton !== false) transport.appendChild(playBtn);

  // Marantz-style display
  const display = document.createElement('div');
  display.className = 'x-audio__display';

  const trackNameFromSrc = (src) => src
    ? decodeURIComponent(src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    : 'No Track Loaded';

  if (config.playlist && config.playlist.length) {
    // Track picker: a real <select>, styled to sit in the display like the
    // static text it replaces. Switching tracks loads the new src; playback
    // state (playing vs paused) carries over.
    const picker = document.createElement('select');
    picker.className = 'x-audio__display-text x-audio__track-picker';
    config.playlist.forEach((track, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = track.title;
      picker.appendChild(opt);
    });
    const currentIndex = config.playlist.findIndex((t) => t.src === config.src);
    picker.value = String(currentIndex >= 0 ? currentIndex : 0);
    picker.addEventListener('change', () => {
      const track = config.playlist[Number(picker.value)];
      const wasPlaying = !audioEl.paused;
      audioEl.src = track.src;
      audioEl.load();
      if (wasPlaying) audioEl.play().catch(() => {});
    });
    display.appendChild(picker);
  } else {
    const displayText = document.createElement('div');
    displayText.className = 'x-audio__display-text';
    displayText.textContent = trackNameFromSrc(config.src);
    display.appendChild(displayText);
  }

  // Time display
  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'x-audio__display-time';
  timeDisplay.textContent = '0:00 / 0:00';
  display.appendChild(timeDisplay);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  audioEl.addEventListener('timeupdate', () => {
    timeDisplay.textContent = formatTime(audioEl.currentTime) + ' / ' + formatTime(audioEl.duration);
  });

  audioEl.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = '0:00 / ' + formatTime(audioEl.duration);
  });

  // #669: same for the Marantz-style display.
  if (config.showDisplay !== false) transport.appendChild(display);

  // Volume knob area
  const volArea = document.createElement('div');
  volArea.className = 'x-audio__transport-vol';
  const volIcon = document.createElement('span');
  volIcon.className = 'x-audio__vol-icon';
  // #773: the icon states the element's real sound state. It was always the
  // speaker-on glyph, so a player built with `muted` showed sound on while
  // playing silently -- and the showcase's muted row rendered like loop.
  const showVolume = () => {
    volIcon.textContent = audioEl.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'; // 🔇 / 🔊
    volIcon.setAttribute('aria-label', audioEl.muted ? 'Muted' : 'Sound on');
  };
  showVolume();
  audioEl.addEventListener('volumechange', showVolume);
  volArea.appendChild(volIcon);
  transport.appendChild(volArea);

  uiHost(element).appendChild(transport);
}

function buildEqUI(element, audioEl, config, initAudioContext, filters) {
  const sliders = [];
  const sliderVisuals = [];

  // #779: the fill height is the gain, a runtime value -- a generated rule.
  // Its colour (boost / cut / flat) is a state class on the band (audio.css);
  // both used to be written onto element.style.
  function updateSliderVisual(sl, val, activeTrack, dbDisplay) {
    const percent = ((parseFloat(val) + 12) / 24) * 100;
    if (activeTrack) setRule(activeTrack, 'level', { height: percent + '%' });
    if (activeTrack && dbDisplay) {
      const band = activeTrack.closest('.x-audio__eq-band');
      const state = val > 0 ? 'boost' : val < 0 ? 'cut' : 'flat';
      if (band) {
        band.classList.remove('x-audio__eq-band--boost', 'x-audio__eq-band--cut', 'x-audio__eq-band--flat');
        band.classList.add(`x-audio__eq-band--${state}`);
      }
      dbDisplay.textContent = (val > 0 ? '+' : '') + val;
    }
  }

  const eqContainer = document.createElement('div');
  // #779: every part of the EQ below is an .x-audio__eq-* rule in audio.css
  // -- they were Object.assign(el.style, …) blocks and style="" markup.
  eqContainer.className = 'x-audio__eq-container';

  // Header
  const headerRow = document.createElement('div');
  headerRow.className = 'x-audio__eq-header';
  headerRow.innerHTML = '<span class="x-audio__eq-header-icon">🎛️</span><span class="x-audio__eq-header-title">15-BAND GRAPHIC EQUALIZER</span>';
  eqContainer.appendChild(headerRow);

  // Presets
  const buttonRow = document.createElement('div');
  buttonRow.className = 'x-audio__eq-presets';

  const presetData = {
    'Flat': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    'Bass Boost': [8,7,6,4,2,0,0,0,0,0,0,0,0,0,0],
    'Treble': [0,0,0,0,0,0,0,0,2,3,4,5,6,7,8],
    'V-Shape': [6,5,3,1,0,-2,-3,-2,0,1,3,5,6,7,8],
    'Vocal': [-2,-1,0,2,4,5,5,4,3,2,1,0,-1,-2,-2]
  };

  // 'Zero All' removed — identical to the 'Flat' preset below (all-zero gains),
  // just a redundant second button for the same action.
  // 'Demo Track' removed — swapped in https://archive.org/download/nineinchnails_ghosts_I_IV/01_Ghosts_I.mp3 regardless of the
  // author's chosen src, and that file has had its own load reliability
  // issues; a preset button silently changing the loaded track is also
  // surprising UX.

  Object.entries(presetData).forEach(([name, values]) => {
    const btn = createPresetButton(name);
    btn.onclick = () => {
      initAudioContext();
      values.forEach((val, i) => {
        if (filters[i]) filters[i].gain.value = val;
        if (sliders[i] && sliderVisuals[i]) {
          sliders[i].value = val;
          updateSliderVisual(sliders[i], val, sliderVisuals[i].activeTrack, sliderVisuals[i].dbDisplay);
        }
      });
    };
    buttonRow.appendChild(btn);
  });
  eqContainer.appendChild(buttonRow);

  // EQ Panel
  const eqPanel = document.createElement('div');
  eqPanel.className = 'x-audio__eq-panel';

  EQ_BANDS.forEach((band, index) => {
    const { bandContainer, slider, activeTrack, dbDisplay } = createBandSlider(band, index, initAudioContext, filters, updateSliderVisual);
    const start = (config.initialGains && config.initialGains[index]) || 0;
    if (start) {
      slider.value = start;
      updateSliderVisual(slider, start, activeTrack, dbDisplay);
    }
    sliders.push(slider);
    sliderVisuals.push({ activeTrack, dbDisplay });
    eqPanel.appendChild(bandContainer);
  });

  eqContainer.appendChild(eqPanel);

  // Volume control
  const volumeRow = createVolumeRow(audioEl, config);
  eqContainer.appendChild(volumeRow);
  uiHost(element).appendChild(eqContainer);
}

function createPresetButton(text) {
  const btn = document.createElement('button');
  btn.textContent = text;
  // Look and hover: .x-audio__eq-preset in audio.css (#779).
  btn.className = 'x-audio__eq-preset';
  return btn;
}

function createBandSlider(band, index, initAudioContext, filters, updateSliderVisual) {
  // A band starts un-adjusted: no state class yet, so the initial fill
  // gradient and readout colour are the base rules (audio.css), exactly as
  // before the first updateSliderVisual().
  const bandContainer = document.createElement('div');
  bandContainer.className = 'x-audio__eq-band';

  const dbDisplay = document.createElement('div');
  dbDisplay.className = 'x-audio__eq-db';
  dbDisplay.textContent = '0';
  bandContainer.appendChild(dbDisplay);

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'x-audio__eq-slider-wrap';

  const track = document.createElement('div');
  track.className = 'x-audio__eq-track';
  sliderWrap.appendChild(track);

  const activeTrack = document.createElement('div');
  activeTrack.className = 'x-audio__eq-fill';
  sliderWrap.appendChild(activeTrack);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = -12;
  slider.max = 12;
  slider.value = 0;
  slider.className = 'x-audio__eq-slider';

  slider.oninput = (e) => {
    initAudioContext();
    const val = parseFloat(e.target.value);
    if (filters[index]) filters[index].gain.value = val;
    updateSliderVisual(slider, val, activeTrack, dbDisplay);
  };

  sliderWrap.appendChild(slider);
  bandContainer.appendChild(sliderWrap);

  const freqLabel = document.createElement('div');
  freqLabel.className = 'x-audio__eq-freq';
  freqLabel.textContent = band.label;
  bandContainer.appendChild(freqLabel);

  const hzLabel = document.createElement('div');
  hzLabel.className = 'x-audio__eq-hz';
  hzLabel.textContent = 'Hz';
  bandContainer.appendChild(hzLabel);

  return { bandContainer, slider, activeTrack, dbDisplay };
}

function createVolumeRow(audioEl, config) {
  // #779: the master row, its play button, label, slider and readout are
  // .x-audio__master-* rules in audio.css.
  const volumeRow = document.createElement('div');
  volumeRow.className = 'x-audio__master';

  // Play button
  const playBtn = document.createElement('button');
  playBtn.className = 'x-audio__master-play';
  playBtn.innerHTML = '<span class="x-audio__master-icon">🔊</span>';

  let isPlaying = false;
  const updateIcon = () => {
    playBtn.innerHTML = `<span class="x-audio__master-icon">${isPlaying ? '⏸️' : '🔊'}</span>`;
  };
  playBtn.onclick = togglePlayback(audioEl, playBtn);
audioEl.addEventListener('play', () => { isPlaying = true; updateIcon(); });
  audioEl.addEventListener('pause', () => { isPlaying = false; updateIcon(); });
  volumeRow.appendChild(playBtn);

  const label = document.createElement('span');
  label.textContent = 'MASTER';
  label.className = 'x-audio__master-label';
  volumeRow.appendChild(label);

  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = 0;
  volSlider.max = 100;
  volSlider.value = config.volume * 100;
  volSlider.className = 'x-audio__master-vol';
  volumeRow.appendChild(volSlider);

  const volValue = document.createElement('span');
  volValue.className = 'x-audio__master-value';
  volValue.textContent = Math.round(config.volume * 100) + '%';
  volumeRow.appendChild(volValue);

  volSlider.oninput = (e) => {
    audioEl.volume = e.target.value / 100;
    volValue.textContent = Math.round(e.target.value) + '%';
  };

  return volumeRow;
}

function injectAudioStyles() {
  if (document.getElementById('x-audio-eq-css')) return;
  
  const style = document.createElement('style');
  style.id = 'x-audio-eq-css';
  style.textContent = `
    .x-audio__eq-slider {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
    .x-audio__eq-slider:focus { outline: none; }
    .x-audio__eq-slider::-webkit-slider-runnable-track {
      width: 100%; height: 8px;
      background: linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.3) 50%, rgba(99,102,241,0.2) 100%);
      border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
    }
    .x-audio__eq-slider::-moz-range-track {
      width: 100%; height: 8px; background: rgba(99,102,241,0.2); border-radius: 4px;
    }
    .x-audio__eq-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 20px; height: 20px; margin-top: -6px;
      border-radius: 50%; cursor: grab;
      background: radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
                  radial-gradient(ellipse 80% 60% at 40% 30%, rgba(147,197,253,0.5) 0%, transparent 40%),
                  var(--x-audio-knob);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(99,102,241,0.3), inset 0 1px 2px rgba(255,255,255,0.8);
      transition: all 0.1s ease;
    }
    .x-audio__eq-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.5), inset 0 1px 2px rgba(255,255,255,0.9);
    }
    .x-audio__eq-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
    .x-audio__eq-slider::-moz-range-thumb {
      width: 20px; height: 20px; border-radius: 50%; cursor: grab;
      background: var(--x-audio-knob-flat);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(99,102,241,0.3);
    }
    .x-audio__master-vol {
      -webkit-appearance: none; appearance: none;
      background: var(--x-audio-volume-track);
      border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
    }
    .x-audio__master-vol::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
      background: radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
                  var(--x-audio-volume-thumb);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.4); cursor: pointer;
    }
    .x-audio__master-vol::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 25px rgba(59,130,246,0.6);
    }
    .x-audio__master-vol::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--x-audio-volume-thumb-flat);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer;
    }
    /* #1014: [data-theme] plus the class already outranks .x-audio in audio.css. */
    [data-theme="light"] .x-audio {
      background: var(--x-audio-body-light);
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    [data-theme="light"] .x-audio__eq-container { background: rgba(0,0,0,0.05); }
  `;
  document.head.appendChild(style);
}

export default { audio };
