/**
 * Audio - Enhanced <audio> element with 15-Band Graphic Equalizer
 * Premium audio player with Web Audio API EQ, presets, and master volume
 * Helper Attribute: [x-behavior="audio"]
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

export function audio(element, options = {}) {
  // Read plain attributes first (wb-* custom elements), fall back to data-*
  function attr(name) {
    return element.getAttribute(name) ?? element.dataset[name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null;
  }
  const config = {
    src: options.src || attr('src') || '',
    controls: options.controls ?? attr('controls') !== 'false',
    autoplay: options.autoplay ?? (element.hasAttribute('autoplay') || element.hasAttribute('data-autoplay')),
    loop: options.loop ?? (element.hasAttribute('loop') || element.hasAttribute('data-loop')),
    volume: parseFloat(options.volume || attr('volume') || '0.8'),
    showEq: options.showEq ?? (element.hasAttribute('show-eq') || element.hasAttribute('data-show-eq') || attr('show-eq') === 'true' || element.dataset.showEq === 'true'),
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

  injectAudioStyles();
  element.classList.add('wb-audio');
  
  // Dark studio look
  Object.assign(element.style, {
    background: 'linear-gradient(145deg, #0a0a12 0%, #12121c 50%, #0a0a10 100%)',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    minWidth: '320px'
  });

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
  audioEl.volume = Math.max(0, Math.min(1, config.volume));

  // Only replace with the custom Marantz transport when the author actually
  // asked for the enhanced UI: the <wb-audio> custom tag (which has nothing
  // native to fall back to), or show-eq (which needs the custom UI to expose
  // the slider controls). A plain native <audio controls> with neither of
  // those was getting unconditionally hidden and replaced here, silently
  // discarding its native controls for demos that wanted to show them.
  const needsCustomUI = element.tagName !== 'AUDIO' || config.showEq;
  if (needsCustomUI && audioEl.tagName === 'AUDIO') {
    audioEl.style.display = 'none';
  }

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
        filter.gain.value = 0;
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
    element.classList.remove('wb-audio');
    if (audioContext) audioContext.close();
  };
}

function buildTransportUI(element, audioEl, config) {
  const transport = document.createElement('div');
  transport.className = 'wb-audio__transport';

  // Play/Pause button
  const playBtn = document.createElement('button');
  playBtn.className = 'wb-audio__play-btn';
  playBtn.setAttribute('aria-label', 'Play');
  playBtn.innerHTML = '&#9654;'; // ▶
  playBtn.onclick = () => {
    if (!audioEl.paused) { audioEl.pause(); return; }
    // play() returns a promise that rejects if the source can't load
    // (bad URL / unsupported / CORS). Swallow it so it isn't an unhandled
    // rejection, and surface a readable message + visual hint instead.
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        console.warn('[wb-audio] playback failed:', err && err.message);
        playBtn.setAttribute('aria-label', 'Audio source unavailable');
        playBtn.title = 'Audio source unavailable';
      });
    }
  };

  audioEl.addEventListener('play', () => {
    playBtn.innerHTML = '&#9646;&#9646;'; // ❚❚
    playBtn.setAttribute('aria-label', 'Pause');
    playBtn.classList.add('wb-audio__play-btn--playing');
  });
  audioEl.addEventListener('pause', () => {
    playBtn.innerHTML = '&#9654;'; // ▶
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.classList.remove('wb-audio__play-btn--playing');
  });

  transport.appendChild(playBtn);

  // Marantz-style display
  const display = document.createElement('div');
  display.className = 'wb-audio__display';

  const trackNameFromSrc = (src) => src
    ? decodeURIComponent(src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    : 'No Track Loaded';

  if (config.playlist && config.playlist.length) {
    // Track picker: a real <select>, styled to sit in the display like the
    // static text it replaces. Switching tracks loads the new src; playback
    // state (playing vs paused) carries over.
    const picker = document.createElement('select');
    picker.className = 'wb-audio__display-text wb-audio__track-picker';
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
    displayText.className = 'wb-audio__display-text';
    displayText.textContent = trackNameFromSrc(config.src);
    display.appendChild(displayText);
  }

  // Time display
  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'wb-audio__display-time';
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

  transport.appendChild(display);

  // Volume knob area
  const volArea = document.createElement('div');
  volArea.className = 'wb-audio__transport-vol';
  const volIcon = document.createElement('span');
  volIcon.className = 'wb-audio__vol-icon';
  volIcon.textContent = '\uD83D\uDD0A'; // 🔊
  volArea.appendChild(volIcon);
  transport.appendChild(volArea);

  element.appendChild(transport);
}

function buildEqUI(element, audioEl, config, initAudioContext, filters) {
  const sliders = [];
  const sliderVisuals = [];

  function updateSliderVisual(sl, val, activeTrack, dbDisplay) {
    const percent = ((parseFloat(val) + 12) / 24) * 100;
    if (activeTrack) activeTrack.style.height = percent + '%';
    if (activeTrack && dbDisplay) {
      if (val > 0) {
        activeTrack.style.background = 'linear-gradient(180deg, #22c55e 0%, #84cc16 100%)';
        dbDisplay.style.color = '#22c55e';
      } else if (val < 0) {
        activeTrack.style.background = 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)';
        dbDisplay.style.color = '#ef4444';
      } else {
        activeTrack.style.background = 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)';
        dbDisplay.style.color = '#6366f1';
      }
      dbDisplay.textContent = (val > 0 ? '+' : '') + val;
    }
  }

  const eqContainer = document.createElement('div');
  eqContainer.className = 'wb-audio__eq-container';
  Object.assign(eqContainer.style, {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
    borderRadius: '12px',
    padding: '1rem',
    marginTop: '0.75rem',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
  });

  // Header
  const headerRow = document.createElement('div');
  Object.assign(headerRow.style, { display: 'flex', alignItems: 'center', marginBottom: '0.25rem' });
  headerRow.innerHTML = '<span style="font-size:1.25rem;margin-right:0.5rem;">🎛️</span><span style="font-weight:600;color:#fff;font-size:0.9rem;">15-BAND GRAPHIC EQUALIZER</span>';
  eqContainer.appendChild(headerRow);

  // Presets
  const buttonRow = document.createElement('div');
  Object.assign(buttonRow.style, {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem',
    paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)'
  });

  const presetData = {
    'Flat': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    'Bass Boost': [8,7,6,4,2,0,0,0,0,0,0,0,0,0,0],
    'Treble': [0,0,0,0,0,0,0,0,2,3,4,5,6,7,8],
    'V-Shape': [6,5,3,1,0,-2,-3,-2,0,1,3,5,6,7,8],
    'Vocal': [-2,-1,0,2,4,5,5,4,3,2,1,0,-1,-2,-2]
  };

  // 'Zero All' removed — identical to the 'Flat' preset below (all-zero gains),
  // just a redundant second button for the same action.
  // 'Demo Track' removed — swapped in demos/sample.wav regardless of the
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
  Object.assign(eqPanel.style, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.25rem', padding: '0.5rem 0'
  });

  EQ_BANDS.forEach((band, index) => {
    const { bandContainer, slider, activeTrack, dbDisplay } = createBandSlider(band, index, initAudioContext, filters, updateSliderVisual);
    sliders.push(slider);
    sliderVisuals.push({ activeTrack, dbDisplay });
    eqPanel.appendChild(bandContainer);
  });

  eqContainer.appendChild(eqPanel);

  // Volume control
  const volumeRow = createVolumeRow(audioEl, config);
  eqContainer.appendChild(volumeRow);
  element.appendChild(eqContainer);
}

function createPresetButton(text) {
  const btn = document.createElement('button');
  btn.textContent = text;
  Object.assign(btn.style, {
    padding: '0.35rem 0.75rem', fontSize: '0.7rem',
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px', color: '#fff', cursor: 'pointer', transition: 'all 0.15s'
  });
  btn.onmouseenter = () => { btn.style.background = 'rgba(99,102,241,0.3)'; };
  btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.1)'; };
  return btn;
}

function createBandSlider(band, index, initAudioContext, filters, updateSliderVisual) {
  const bandContainer = document.createElement('div');
  Object.assign(bandContainer.style, {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: '1', minWidth: '0'
  });

  const dbDisplay = document.createElement('div');
  Object.assign(dbDisplay.style, {
    fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace",
    color: '#6366f1', fontWeight: '600', height: '1rem', textShadow: '0 0 8px rgba(99,102,241,0.5)'
  });
  dbDisplay.textContent = '0';
  bandContainer.appendChild(dbDisplay);

  const sliderWrap = document.createElement('div');
  Object.assign(sliderWrap.style, {
    position: 'relative', width: '100%', height: '120px',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  });

  const track = document.createElement('div');
  Object.assign(track.style, {
    position: 'absolute', width: '8px', height: '100%',
    background: 'linear-gradient(180deg, #22c55e 0%, #84cc16 20%, #eab308 40%, #f97316 60%, #ef4444 80%, #dc2626 100%)',
    borderRadius: '4px', opacity: '0.3', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)'
  });
  sliderWrap.appendChild(track);

  const activeTrack = document.createElement('div');
  Object.assign(activeTrack.style, {
    position: 'absolute', width: '8px', height: '50%', bottom: '0',
    background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    borderRadius: '4px', boxShadow: '0 0 10px rgba(99,102,241,0.5)', transition: 'height 0.1s ease'
  });
  sliderWrap.appendChild(activeTrack);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = -12;
  slider.max = 12;
  slider.value = 0;
  slider.className = 'wb-audio__eq-slider';
  Object.assign(slider.style, {
    width: '120px', height: '24px', transform: 'rotate(-90deg)',
    transformOrigin: 'center center', position: 'absolute',
    background: 'transparent', cursor: 'pointer', margin: '0'
  });

  slider.oninput = (e) => {
    initAudioContext();
    const val = parseFloat(e.target.value);
    if (filters[index]) filters[index].gain.value = val;
    updateSliderVisual(slider, val, activeTrack, dbDisplay);
  };

  sliderWrap.appendChild(slider);
  bandContainer.appendChild(sliderWrap);

  const freqLabel = document.createElement('div');
  Object.assign(freqLabel.style, {
    fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: '0.25rem'
  });
  freqLabel.textContent = band.label;
  bandContainer.appendChild(freqLabel);

  const hzLabel = document.createElement('div');
  Object.assign(hzLabel.style, { fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' });
  hzLabel.textContent = 'Hz';
  bandContainer.appendChild(hzLabel);

  return { bandContainer, slider, activeTrack, dbDisplay };
}

function createVolumeRow(audioEl, config) {
  const volumeRow = document.createElement('div');
  Object.assign(volumeRow.style, {
    display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem',
    padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'
  });

  // Play button
  const playBtn = document.createElement('button');
  playBtn.innerHTML = '<span style="font-size:1.25rem;">🔊</span>';
  Object.assign(playBtn.style, {
    background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem 0 0'
  });
  
  let isPlaying = false;
  const updateIcon = () => {
    playBtn.innerHTML = isPlaying ? '<span style="font-size:1.25rem;">⏸️</span>' : '<span style="font-size:1.25rem;">🔊</span>';
  };
  playBtn.onclick = () => {
    if (!audioEl.paused) { audioEl.pause(); return; }
    // play() returns a promise that rejects if the source can't load
    // (bad URL / unsupported / CORS). Swallow it so it isn't an unhandled
    // rejection, and surface a readable message + visual hint instead.
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        console.warn('[wb-audio] playback failed:', err && err.message);
        playBtn.setAttribute('aria-label', 'Audio source unavailable');
        playBtn.title = 'Audio source unavailable';
      });
    }
  };
  audioEl.addEventListener('play', () => { isPlaying = true; updateIcon(); });
  audioEl.addEventListener('pause', () => { isPlaying = false; updateIcon(); });
  volumeRow.appendChild(playBtn);

  const label = document.createElement('span');
  label.textContent = 'MASTER';
  Object.assign(label.style, { fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' });
  volumeRow.appendChild(label);

  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = 0;
  volSlider.max = 100;
  volSlider.value = config.volume * 100;
  volSlider.className = 'wb-audio__master-vol';
  Object.assign(volSlider.style, { flex: '1', height: '8px', cursor: 'pointer' });
  volumeRow.appendChild(volSlider);

  const volValue = document.createElement('span');
  Object.assign(volValue.style, {
    fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
    color: '#3b82f6', fontWeight: '600', minWidth: '3rem', textAlign: 'right'
  });
  volValue.textContent = Math.round(config.volume * 100) + '%';
  volumeRow.appendChild(volValue);

  volSlider.oninput = (e) => {
    audioEl.volume = e.target.value / 100;
    volValue.textContent = Math.round(e.target.value) + '%';
  };

  return volumeRow;
}

function injectAudioStyles() {
  if (document.getElementById('wb-audio-eq-css')) return;
  
  const style = document.createElement('style');
  style.id = 'wb-audio-eq-css';
  style.textContent = `
    .wb-audio__eq-slider {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
    .wb-audio__eq-slider:focus { outline: none; }
    .wb-audio__eq-slider::-webkit-slider-runnable-track {
      width: 100%; height: 8px;
      background: linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.3) 50%, rgba(99,102,241,0.2) 100%);
      border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
    }
    .wb-audio__eq-slider::-moz-range-track {
      width: 100%; height: 8px; background: rgba(99,102,241,0.2); border-radius: 4px;
    }
    .wb-audio__eq-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 20px; height: 20px; margin-top: -6px;
      border-radius: 50%; cursor: grab;
      background: radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
                  radial-gradient(ellipse 80% 60% at 40% 30%, rgba(147,197,253,0.5) 0%, transparent 40%),
                  linear-gradient(180deg, #f8f8ff 0%, #c8c8e0 30%, #8888b0 60%, #5858a0 100%);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(99,102,241,0.3), inset 0 1px 2px rgba(255,255,255,0.8);
      transition: all 0.1s ease;
    }
    .wb-audio__eq-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.5), inset 0 1px 2px rgba(255,255,255,0.9);
    }
    .wb-audio__eq-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
    .wb-audio__eq-slider::-moz-range-thumb {
      width: 20px; height: 20px; border-radius: 50%; cursor: grab;
      background: linear-gradient(180deg, #f8f8ff 0%, #8888b0 60%, #5858a0 100%);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(99,102,241,0.3);
    }
    .wb-audio__master-vol {
      -webkit-appearance: none; appearance: none;
      background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
      border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
    }
    .wb-audio__master-vol::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
      background: radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
                  linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.4); cursor: pointer;
    }
    .wb-audio__master-vol::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 25px rgba(59,130,246,0.6);
    }
    .wb-audio__master-vol::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%;
      background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer;
    }
    [data-theme="light"] .wb-audio {
      background: linear-gradient(145deg, #e8e8f0 0%, #d8d8e8 50%, #c8c8d8 100%) !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
    }
    [data-theme="light"] .wb-audio__eq-container { background: rgba(0,0,0,0.05) !important; }
  `;
  document.head.appendChild(style);
}

export default { audio };
