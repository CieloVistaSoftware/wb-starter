/**
 * Media Behaviors
 * -----------------------------------------------------------------------------
 * Collection of behaviors for enhanced media elements including images,
 * video players, audio players, and galleries.
 *
 * Custom Tag: <wb-media>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <img x-image data-zoomable src="...">
 *   <wb-video  data-src="..."></div>
 */
/**
 * Image - Enhanced images
 * Helper Attribute: [x-image]
 */
export function image(element, options = {}) {
    const config = {
        lazy: options.lazy ?? element.hasAttribute('data-lazy'),
        zoomable: options.zoomable ?? element.hasAttribute('data-zoomable'),
        placeholder: options.placeholder || element.dataset.placeholder || '',
        fallback: options.fallback || element.dataset.fallback || '',
        aspectRatio: options.aspectRatio || element.dataset.aspectRatio || '',
        ...options
    };
    element.classList.add('wb-image');
    if (config.lazy) {
        element.loading = 'lazy';
    }
    if (config.aspectRatio) {
        element.style.aspectRatio = config.aspectRatio;
        element.style.objectFit = 'cover';
    }
    if (config.fallback) {
        element.onerror = () => { element.src = config.fallback; };
    }
    if (config.zoomable) {
        element.classList.add('wb-image--zoomable');
        element.onclick = () => openLightbox(element.src);
    }
    return () => element.classList.remove('wb-image');
}
function openLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'wb-lightbox';
    overlay.innerHTML = `<img src="${src}" class="wb-lightbox__img">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}
/**
 * Gallery - Image gallery
 * Custom Tag: <wb-gallery>
 */
export function gallery(element, options = {}) {
    const config = {
        columns: parseInt(options.columns || element.dataset.columns || '3'),
        gap: options.gap || element.dataset.gap || '1rem',
        lightbox: options.lightbox ?? element.dataset.lightbox !== 'false',
        ...options
    };
    element.classList.add('wb-gallery');
    element.style.display = 'grid';
    element.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
    element.style.gap = config.gap;
    if (config.lightbox) {
        const images = element.querySelectorAll('img');
        images.forEach((img, i) => {
            img.classList.add('wb-gallery__item');
            img.onclick = () => openGalleryLightbox(images, i);
        });
    }
    return () => element.classList.remove('wb-gallery');
}
function openGalleryLightbox(images, index) {
    let current = index;
    const overlay = document.createElement('div');
    overlay.className = 'wb-lightbox wb-lightbox--gallery';
    const render = () => {
        overlay.innerHTML = `
      <button class="wb-lightbox__prev">‹</button>
      <img src="${images[current].src}" class="wb-lightbox__img">
      <button class="wb-lightbox__next">›</button>
      <button class="wb-lightbox__close">×</button>
      <div class="wb-lightbox__counter">${current + 1} / ${images.length}</div>
    `;
        overlay.querySelector('.wb-lightbox__prev').onclick = (e) => { e.stopPropagation(); current = (current - 1 + images.length) % images.length; render(); };
        overlay.querySelector('.wb-lightbox__next').onclick = (e) => { e.stopPropagation(); current = (current + 1) % images.length; render(); };
        overlay.querySelector('.wb-lightbox__close').onclick = () => overlay.remove();
    };
    render();
    overlay.onclick = (e) => { if (e.target === overlay)
        overlay.remove(); };
    document.body.appendChild(overlay);
}
/**
 * Video - Enhanced video player
 * Custom Tag: <wb-video>
 */
export function video(element, options = {}) {
    const config = {
        src: options.src || element.dataset.src || '',
        controls: options.controls ?? element.dataset.controls !== 'false',
        autoplay: options.autoplay ?? element.hasAttribute('data-autoplay'),
        muted: options.muted ?? element.hasAttribute('data-muted'),
        loop: options.loop ?? element.hasAttribute('data-loop'),
        poster: options.poster || element.dataset.poster || '',
        playsinline: options.playsinline ?? element.dataset.playsinline !== 'false',
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
        if (config.src)
            videoEl.src = config.src;
        element.appendChild(videoEl);
    }
    if (config.controls)
        videoEl.controls = true;
    if (config.autoplay)
        videoEl.autoplay = true;
    if (config.muted)
        videoEl.muted = true;
    if (config.loop)
        videoEl.loop = true;
    if (config.poster)
        videoEl.poster = config.poster;
    if (config.playsinline)
        videoEl.playsInline = true;
    element.wbVideo = {
        play: () => videoEl.play(),
        pause: () => videoEl.pause(),
        toggle: () => videoEl.paused ? videoEl.play() : videoEl.pause(),
        setTime: (t) => { videoEl.currentTime = t; }
    };
    return () => element.classList.remove('wb-video');
}
// ============================================================================
// 15-BAND GRAPHIC EQUALIZER FREQUENCIES (ISO standard)
// ============================================================================
const EQ_BANDS = [
    { freq: 25, label: '25' },
    { freq: 40, label: '40' },
    { freq: 63, label: '63' },
    { freq: 100, label: '100' },
    { freq: 160, label: '160' },
    { freq: 250, label: '250' },
    { freq: 400, label: '400' },
    { freq: 630, label: '630' },
    { freq: 1000, label: '1K' },
    { freq: 1600, label: '1.6K' },
    { freq: 2500, label: '2.5K' },
    { freq: 4000, label: '4K' },
    { freq: 6300, label: '6.3K' },
    { freq: 10000, label: '10K' },
    { freq: 16000, label: '16K' }
];
/**
 * Audio - Enhanced audio player with 15-BAND GRAPHIC EQUALIZER
 * Custom Tag: <wb-audio>
 * Premium plastic slider design with 3D appearance
 */
export function audio(element, options = {}) {
    const config = {
        src: options.src || element.dataset.src || '',
        controls: options.controls ?? element.dataset.controls !== 'false',
        autoplay: options.autoplay ?? (element.hasAttribute('data-autoplay') && element.dataset.autoplay !== 'false'),
        loop: options.loop ?? (element.hasAttribute('data-loop') && element.dataset.loop !== 'false'),
        volume: parseFloat(options.volume || element.dataset.volume || '0.8'),
        showEq: options.showEq ?? (element.dataset.showEq === 'true' || (element.hasAttribute('data-show-eq') && element.dataset.showEq !== 'false')),
        ...options
    };
    // Inject styles
    injectAudioStyles();
    // If element is AUDIO, we need to wrap it to apply container styles correctly
    // without breaking the native controls or layout
    let container = element;
    let wrapper = null;
    if (element.tagName === 'AUDIO') {
        // Create wrapper
        wrapper = document.createElement('div');
        wrapper.className = 'wb-audio-wrapper';
        // Insert wrapper before element
        if (element.parentNode) {
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
            container = wrapper;
        }
    }
    container.classList.add('wb-audio');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Audio Player');
    // Apply container styles - dark studio look
    Object.assign(container.style, {
        background: 'linear-gradient(145deg, #0a0a12 0%, #12121c 50%, #0a0a10 100%)',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        minWidth: '320px',
        display: 'block'
    });
    // Debug: log audio element state
    setTimeout(() => {
        console.log('[WB Audio] src:', config.src, 'volume:', config.volume, 'muted:', audioEl.muted, 'autoplay:', config.autoplay, 'controls:', config.controls);
        if (audioEl.error) {
            console.error('[WB Audio] Audio error:', audioEl.error);
        }
    }, 1000);
    // Create audio element if src provided but element is a div
    let audioEl = element;
    let enableEq = config.showEq;
    if (element.tagName !== 'AUDIO' && config.src) {
        element.innerHTML = '';
        audioEl = document.createElement('audio');
        // CORS required for Web Audio API
        if (enableEq) {
            audioEl.crossOrigin = 'anonymous';
            // Fallback: if CORS fails, try without it (disables EQ)
            audioEl.addEventListener('error', (e) => {
                // Check if it might be a CORS issue (Network or SrcNotSupported)
                if (audioEl.crossOrigin && audioEl.error && (audioEl.error.code === 4 || audioEl.error.code === 2)) {
                    console.warn('[WB Audio] CORS/Network error, falling back to standard playback (EQ disabled)');
                    audioEl.crossOrigin = null;
                    audioEl.removeAttribute('crossorigin');
                    enableEq = false; // Disable EQ for this instance
                    audioEl.src = config.src; // Reload
                    audioEl.load();
                    if (config.autoplay)
                        audioEl.play().catch(e => console.warn('Autoplay failed after fallback', e));
                }
            }, { once: true });
        }
        audioEl.src = config.src;
        element.appendChild(audioEl);
    }
    else if (element.tagName === 'AUDIO' && enableEq && !audioEl.crossOrigin) {
        // Try to enable CORS for existing elements if EQ is requested
        audioEl.crossOrigin = 'anonymous';
        // Force reload to apply CORS setting
        const currentSrc = audioEl.src;
        if (currentSrc) {
            audioEl.src = '';
            audioEl.src = currentSrc;
        }
    }
    if (config.controls)
        audioEl.controls = true;
    if (config.autoplay)
        audioEl.autoplay = true;
    if (config.loop) {
        audioEl.loop = true;
        audioEl.setAttribute('loop', '');
    }
    else {
        audioEl.loop = false;
        audioEl.removeAttribute('loop');
    }
    audioEl.volume = Math.max(0, Math.min(1, config.volume));
    // Style the audio element
    if (audioEl.tagName === 'AUDIO') {
        Object.assign(audioEl.style, {
            width: '100%',
            height: '48px',
            borderRadius: '8px',
            outline: 'none',
            marginBottom: '0.5rem'
        });
    }
    // Web Audio API for 15-band EQ
    let audioContext = null;
    let sourceNode = null;
    let filters = [];
    let gainNode = null;
    let isInitialized = false;
    // Resume AudioContext on user gesture if needed
    function resumeAudioContextIfNeeded() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('[WB Audio] AudioContext resumed');
            });
        }
    }
    const initAudioContext = () => {
        if (isInitialized)
            return;
        // Safety check: if EQ was disabled (e.g. by fallback), do not use Web Audio
        if (!enableEq) {
            return;
        }
        // Double check: if crossOrigin is missing, we can't use Web Audio safely
        if (!audioEl.crossOrigin) {
            console.warn('[WB Audio] Skipping EQ: No CORS access');
            return;
        }
        isInitialized = true;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext)
                return;
            audioContext = new AudioContext();
            sourceNode = audioContext.createMediaElementSource(audioEl);
            // Create 15-band EQ filters
            filters = EQ_BANDS.map(band => {
                const filter = audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = band.freq;
                filter.Q.value = 1.4; // Moderate Q for musical response
                filter.gain.value = 0;
                return filter;
            });
            // Master gain
            gainNode = audioContext.createGain();
            gainNode.gain.value = 1;
            // Chain: source -> filters -> gain -> destination
            sourceNode.connect(filters[0]);
            for (let i = 0; i < filters.length - 1; i++) {
                filters[i].connect(filters[i + 1]);
            }
            filters[filters.length - 1].connect(gainNode);
            gainNode.connect(audioContext.destination);
            // Resume context on play or user gesture
            audioEl.addEventListener('play', resumeAudioContextIfNeeded);
            window.addEventListener('click', resumeAudioContextIfNeeded, { once: true });
            window.addEventListener('keydown', resumeAudioContextIfNeeded, { once: true });
            console.log('[WB Audio] 15-band EQ initialized');
        }
        catch (e) {
            console.warn('[WB Audio] Web Audio API error:', e);
        }
    };
    // =========================================================================
    // BUILD 15-BAND GRAPHIC EQ UI
    // =========================================================================
    if (config.showEq) {
        // Only initialize Web Audio if EQ is enabled
        audioEl.addEventListener('play', initAudioContext, { once: true });
        // Top-level updateSliderVisual so it is available for all slider and preset events
        function updateSliderVisual(sl, val, activeTrack, dbDisplay) {
            const percent = ((parseFloat(val) + 12) / 24) * 100;
            if (activeTrack)
                activeTrack.style.height = percent + '%';
            // Color based on boost/cut
            if (activeTrack && dbDisplay) {
                if (val > 0) {
                    activeTrack.style.background = 'linear-gradient(180deg, #22c55e 0%, #84cc16 100%)';
                    dbDisplay.style.color = '#22c55e';
                }
                else if (val < 0) {
                    activeTrack.style.background = 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)';
                    dbDisplay.style.color = '#ef4444';
                }
                else {
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
        // Header with title and presets
        // Header row: icon and title only
        const headerRow = document.createElement('div');
        Object.assign(headerRow.style, {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.25rem',
            paddingBottom: '0',
            borderBottom: 'none'
        });
        const title = document.createElement('div');
        title.innerHTML = '<span style="font-size:1.25rem;margin-right:0.5rem;">🎛️</span><span style="font-weight:600;color:#fff;font-size:0.9rem;">15-BAND GRAPHIC EQUALIZER</span>';
        headerRow.appendChild(title);
        eqContainer.appendChild(headerRow);
        // Controls row: Play/Pause and Master Volume
        const controlsRow = document.createElement('div');
        Object.assign(controlsRow.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
        });
        // Play/Pause Button
        const playBtn = document.createElement('button');
        playBtn.className = 'wb-audio__eq-play-btn';
        playBtn.setAttribute('aria-label', 'Play/Pause');
        playBtn.innerHTML = audioEl.paused ? '🔊' : '⏸️';
        Object.assign(playBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
        });
        playBtn.onclick = () => {
            if (audioEl.paused) {
                audioEl.play();
                playBtn.innerHTML = '⏸️';
            }
            else {
                audioEl.pause();
                playBtn.innerHTML = '🔊';
            }
        };
        audioEl.addEventListener('play', () => { playBtn.innerHTML = '⏸️'; });
        audioEl.addEventListener('pause', () => { playBtn.innerHTML = '🔊'; });
        controlsRow.appendChild(playBtn);
        // Master Volume
        const volContainer = document.createElement('div');
        Object.assign(volContainer.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        });
        const volLabel = document.createElement('span');
        volLabel.textContent = 'VOL';
        Object.assign(volLabel.style, {
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: '600'
        });
        volContainer.appendChild(volLabel);
        const masterVol = document.createElement('input');
        masterVol.type = 'range';
        masterVol.min = 0;
        masterVol.max = 100;
        masterVol.value = audioEl.volume * 100;
        masterVol.className = 'wb-audio__master-vol wb-audio__eq-master-volume';
        Object.assign(masterVol.style, {
            width: '100px',
            height: '6px'
        });
        masterVol.oninput = (e) => {
            audioEl.volume = e.target.value / 100;
        };
        audioEl.addEventListener('volumechange', () => {
            masterVol.value = audioEl.volume * 100;
        });
        volContainer.appendChild(masterVol);
        controlsRow.appendChild(volContainer);
        eqContainer.appendChild(controlsRow);
        // Button row: all preset and zero buttons
        const buttonRow = document.createElement('div');
        Object.assign(buttonRow.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
        });
        // Make buttons grow and shrink but not the sliders
        buttonRow.style.justifyContent = 'flex-start';
        buttonRow.style.alignItems = 'center';
        buttonRow.style.rowGap = '0.5rem';
        buttonRow.style.flexWrap = 'wrap';
        const presetData = {
            'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'Bass Boost': [8, 7, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'Treble': [0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 8],
            'V-Shape': [6, 5, 3, 1, 0, -2, -3, -2, 0, 1, 3, 5, 6, 7, 8],
            'Vocal': [-2, -1, 0, 2, 4, 5, 5, 4, 3, 2, 1, 0, -1, -2, -2]
        };
        // Will be filled after slider creation
        const sliders = [];
        const sliderVisuals = [];
        // Add Zero All button
        const zeroBtn = document.createElement('button');
        zeroBtn.textContent = 'Zero All';
        Object.assign(zeroBtn.style, {
            padding: '0.35rem 0.75rem',
            fontSize: '0.7rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.15s'
        });
        zeroBtn.onmouseenter = () => { zeroBtn.style.background = 'rgba(99,102,241,0.3)'; };
        zeroBtn.onmouseleave = () => { zeroBtn.style.background = 'rgba(255,255,255,0.1)'; };
        zeroBtn.onclick = () => {
            // Always set all sliders and filter gains to zero, even if not initialized
            sliders.forEach((sl, i) => {
                sl.value = 0;
                const vis = sliderVisuals[i];
                if (vis) {
                    updateSliderVisual(sl, 0, vis.activeTrack, vis.dbDisplay);
                }
            });
            if (typeof initAudioContext === 'function')
                initAudioContext();
            if (filters && filters.length) {
                filters.forEach(f => { if (f)
                    f.gain.value = 0; });
            }
        };
        buttonRow.appendChild(zeroBtn);
        Object.keys(presetData).forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = name;
            Object.assign(btn.style, {
                padding: '0.35rem 0.75rem',
                fontSize: '0.7rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s'
            });
            btn.onmouseenter = () => { btn.style.background = 'rgba(99,102,241,0.3)'; };
            btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.1)'; };
            btn.onclick = () => {
                initAudioContext();
                presetData[name].forEach((presetVal, i) => {
                    if (filters[i])
                        filters[i].gain.value = presetVal;
                    const presetSlider = sliders[i];
                    const presetVisuals = sliderVisuals[i];
                    if (presetSlider && presetVisuals) {
                        presetSlider.value = presetVal;
                        updateSliderVisual(presetSlider, presetVal, presetVisuals.activeTrack, presetVisuals.dbDisplay);
                    }
                });
            };
            buttonRow.appendChild(btn);
        });
        eqContainer.appendChild(buttonRow);
        // EQ Sliders Container
        const eqPanel = document.createElement('div');
        eqPanel.className = 'wb-audio__eq';
        Object.assign(eqPanel.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '0.25rem',
            padding: '0.5rem 0'
        });
        // Create each band slider (vertical)
        EQ_BANDS.forEach((band, index) => {
            const bandContainer = document.createElement('div');
            Object.assign(bandContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                flex: '1',
                minWidth: '0'
            });
            // dB value display
            const dbDisplay = document.createElement('div');
            dbDisplay.className = 'wb-eq-db';
            Object.assign(dbDisplay.style, {
                fontSize: '0.6rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#6366f1',
                fontWeight: '600',
                height: '1rem',
                textShadow: '0 0 8px rgba(99,102,241,0.5)'
            });
            dbDisplay.textContent = '0';
            bandContainer.appendChild(dbDisplay);
            // Slider track container (vertical)
            const sliderWrap = document.createElement('div');
            Object.assign(sliderWrap.style, {
                position: 'relative',
                width: '100%',
                height: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            // Track background with gradient
            const track = document.createElement('div');
            Object.assign(track.style, {
                position: 'absolute',
                width: '8px',
                height: '100%',
                background: 'linear-gradient(180deg, #22c55e 0%, #84cc16 20%, #eab308 40%, #f97316 60%, #ef4444 80%, #dc2626 100%)',
                borderRadius: '4px',
                opacity: '0.3',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)'
            });
            sliderWrap.appendChild(track);
            // Active track (shows level)
            const activeTrack = document.createElement('div');
            activeTrack.className = 'wb-eq-active-track';
            Object.assign(activeTrack.style, {
                position: 'absolute',
                width: '8px',
                height: '50%',
                bottom: '0',
                background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                borderRadius: '4px',
                boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                transition: 'height 0.1s ease'
            });
            sliderWrap.appendChild(activeTrack);
            // Vertical slider input
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = -12;
            slider.max = 12;
            slider.value = 0;
            slider.className = 'wb-audio__eq-slider';
            Object.assign(slider.style, {
                width: '120px',
                height: '24px',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center center',
                position: 'absolute',
                background: 'transparent',
                cursor: 'pointer',
                margin: '0'
            });
            slider.oninput = (e) => {
                initAudioContext();
                const bandVal = parseFloat(e.target.value);
                if (filters[index]) {
                    filters[index].gain.value = bandVal;
                }
                updateSliderVisual(slider, bandVal, activeTrack, dbDisplay);
            };
            sliders.push(slider);
            sliderVisuals.push({ activeTrack, dbDisplay });
            sliderWrap.appendChild(slider);
            bandContainer.appendChild(sliderWrap);
            // Frequency label
            const freqLabel = document.createElement('div');
            Object.assign(freqLabel.style, {
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '500',
                textAlign: 'center',
                marginTop: '0.25rem'
            });
            freqLabel.textContent = band.label;
            bandContainer.appendChild(freqLabel);
            // Hz label
            const hzLabel = document.createElement('div');
            Object.assign(hzLabel.style, {
                fontSize: '0.45rem',
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase'
            });
            hzLabel.textContent = 'Hz';
            bandContainer.appendChild(hzLabel);
            eqPanel.appendChild(bandContainer);
        });
        eqContainer.appendChild(eqPanel);
        container.appendChild(eqContainer);
    }
    // Initialize on first play ONLY if EQ is enabled
    if (config.showEq) {
        audioEl.addEventListener('play', initAudioContext, { once: true });
    }
    // API
    element.wbAudio = {
        play: () => audioEl.play(),
        pause: () => audioEl.pause(),
        toggle: () => audioEl.paused ? audioEl.play() : audioEl.pause(),
        setVolume: (v) => { audioEl.volume = Math.max(0, Math.min(1, v)); },
        setBand: (index, gain) => {
            initAudioContext();
            if (filters[index])
                filters[index].gain.value = gain;
        },
        getFilters: () => filters,
        getAudioContext: () => audioContext
    };
    element.dataset.wbReady = 'audio';
    return () => {
        container.classList.remove('wb-audio');
        if (wrapper && wrapper.parentNode) {
            wrapper.parentNode.insertBefore(element, wrapper);
            wrapper.remove();
        }
        if (audioContext)
            audioContext.close();
    };
}
/**
 * Inject premium EQ slider styles
 */
function injectAudioStyles() {
    if (document.getElementById('wb-audio-eq-css'))
        return;
    const style = document.createElement('style');
    style.id = 'wb-audio-eq-css';
    style.textContent = `
    /* =========================================
       15-BAND GRAPHIC EQUALIZER STYLES
       ========================================= */
    
    .wb-audio__eq-slider {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
    
    .wb-audio__eq-slider:focus {
      outline: none;
    }
    
    /* Vertical slider track (appears horizontal, rotated) */
    .wb-audio__eq-slider::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px;
      background: linear-gradient(90deg, 
        rgba(99,102,241,0.2) 0%, 
        rgba(139,92,246,0.3) 50%, 
        rgba(99,102,241,0.2) 100%);
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .wb-audio__eq-slider::-moz-range-track {
      width: 100%;
      height: 8px;
      background: rgba(99,102,241,0.2);
      border-radius: 4px;
    }
    
    /* Slider thumb - premium knob */
    .wb-audio__eq-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      margin-top: -6px;
      border-radius: 50%;
      cursor: grab;
      background: 
        radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
        radial-gradient(ellipse 80% 60% at 40% 30%, rgba(147,197,253,0.5) 0%, transparent 40%),
        linear-gradient(180deg, #f8f8ff 0%, #c8c8e0 30%, #8888b0 60%, #5858a0 100%);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 
        0 2px 8px rgba(0,0,0,0.5),
        0 0 12px rgba(99,102,241,0.3),
        inset 0 1px 2px rgba(255,255,255,0.8);
      transition: all 0.1s ease;
    }
    
    .wb-audio__eq-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 
        0 4px 12px rgba(0,0,0,0.6),
        0 0 20px rgba(99,102,241,0.5),
        inset 0 1px 2px rgba(255,255,255,0.9);
    }
    
    .wb-audio__eq-slider::-webkit-slider-thumb:active {
      cursor: grabbing;
      transform: scale(1.1);
    }
    
    .wb-audio__eq-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: grab;
      background: linear-gradient(180deg, #f8f8ff 0%, #8888b0 60%, #5858a0 100%);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(99,102,241,0.3);
    }
    
    /* Master volume slider */
    .wb-audio__master-vol {
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .wb-audio__master-vol::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: 
        radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 50%),
        linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.4);
      cursor: pointer;
    }
    
    .wb-audio__master-vol::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 25px rgba(59,130,246,0.6);
    }
    
    .wb-audio__master-vol::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
      border: 2px solid rgba(59,130,246,0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    
    /* Light theme */
    [data-theme="light"] .wb-audio {
      background: linear-gradient(145deg, #e8e8f0 0%, #d8d8e8 50%, #c8c8d8 100%) !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
    }
    
    [data-theme="light"] .wb-audio__eq-container {
      background: rgba(0,0,0,0.05) !important;
    }
  `;
    document.head.appendChild(style);
}
/**
 * Custom Tag: <wb-youtube>
 * YouTube - YouTube embed
 */
export function youtube(element, options = {}) {
    const config = {
        id: options.id || element.dataset.id,
        autoplay: options.autoplay ?? element.hasAttribute('data-autoplay'),
        muted: options.muted ?? element.hasAttribute('data-muted'),
        loop: options.loop ?? element.hasAttribute('data-loop'),
        controls: options.controls ?? (element.dataset.controls !== 'false'),
        ...options
    };
    if (!config.id) {
        console.warn('[WB YouTube] No video ID provided');
        return;
    }
    element.classList.add('wb-youtube');
    element.style.aspectRatio = '16/9';
    element.style.width = '100%';
    element.style.background = '#000';
    element.style.borderRadius = '8px';
    element.style.overflow = 'hidden';
    const params = new URLSearchParams({
        autoplay: config.autoplay ? '1' : '0',
        mute: config.muted ? '1' : '0',
        loop: config.loop ? '1' : '0',
        controls: config.controls ? '1' : '0',
        rel: '0',
        modestbranding: '1'
    });
    if (config.loop)
        params.set('playlist', config.id);
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${config.id}?${params}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    element.innerHTML = '';
    element.appendChild(iframe);
    element.dataset.wbReady = 'youtube';
    return () => element.classList.remove('wb-youtube');
}
/**
 * Custom Tag: <wb-vimeo>
 * Vimeo - Vimeo embed
 */
export function vimeo(element, options = {}) {
    const config = {
        id: options.id || element.dataset.id,
        autoplay: options.autoplay ?? element.hasAttribute('data-autoplay'),
        muted: options.muted ?? element.hasAttribute('data-muted'),
        loop: options.loop ?? element.hasAttribute('data-loop'),
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
    const embedParams = new URLSearchParams({
        autoplay: config.autoplay ? '1' : '0',
        muted: config.muted ? '1' : '0',
        loop: config.loop ? '1' : '0'
    });
    const videoIframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${config.id}?${params}`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    element.innerHTML = '';
    element.appendChild(iframe);
    element.dataset.wbReady = 'vimeo';
    return () => element.classList.remove('wb-vimeo');
}
/* Custom Tag: <wb-ratio>
 **
 * Ratio - Aspect ratio container
 */
export function ratio(element, options = {}) {
    const config = {
        ratio: options.ratio || element.dataset.ratio || '16x9',
        ...options
    };
    element.classList.add('wb-ratio');
    // Convert 16x9 to 16/9 for CSS
    const cssRatio = config.ratio.replace('x', '/').replace(':', '/');
    element.style.aspectRatio = cssRatio;
    // Ensure children cover the area
    // Only apply if it's a direct media child or iframe
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
/* Custom Tag: <wb-figure>
 **
 * Figure - Enhanced figure with caption positioning and zoom
 */
export function figure(element, options = {}) {
    const config = {
        zoom: options.zoom ?? (element.dataset.zoom === 'true'),
        lightbox: options.lightbox ?? (element.dataset.lightbox === 'true'),
        captionPosition: options.captionPosition || element.dataset.captionPosition || 'bottom',
        caption: options.caption || element.dataset.caption,
        ...options
    };
    element.classList.add('wb-figure');
    // Handle data-caption
    let caption = element.querySelector('figcaption');
    if (config.caption) {
        if (!caption) {
            caption = document.createElement('figcaption');
            element.appendChild(caption);
        }
        caption.textContent = config.caption;
    }
    if (config.captionPosition === 'overlay') {
        element.classList.add('wb-figure--overlay');
        element.style.position = 'relative';
        if (caption) {
            Object.assign(caption.style, {
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '0.5rem 1rem',
                margin: '0'
            });
        }
    }
    const img = element.querySelector('img');
    if (img) {
        if (config.zoom || config.lightbox) {
            img.style.cursor = 'zoom-in';
            img.onclick = () => openLightbox(img.src);
        }
    }
    return () => {
        element.classList.remove('wb-figure', 'wb-figure--overlay');
        if (img)
            img.onclick = null;
    };
}
// Export aliases for compatibility
const img = image;
const aspectratio = ratio;
export { img, aspectratio };
export default {
    image,
    gallery,
    video,
    audio,
    youtube,
    vimeo,
    ratio,
    figure,
    img: image,
    aspectratio: ratio
};
//# sourceMappingURL=media.js.map