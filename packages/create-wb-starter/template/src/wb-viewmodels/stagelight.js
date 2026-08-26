import { readAttr } from '../core/read-attr.js';
/**
 * Stage Light Component
 * -----------------------------------------------------------------------------
 * Provides three stage lighting effects:
 * 1. Beam: Decorative sweeping beam (CSS animation)
 * 2. Spotlight: Mouse-tracking overlay (fixed positioning)
 * 3. Fixture: UI element representation of a physical light
 * 
 * Usage:
 * <div x-stagelight variant="beam" color="#ff0000"></div>
 * <div x-stagelight variant="spotlight"></div>
 * -----------------------------------------------------------------------------
 */

// Inject styles lazily
function injectStyles() {
  if (document.getElementById('x-stagelight-styles')) return;

  const style = document.createElement('style');
  style.id = 'x-stagelight-styles';
  style.textContent = `
    .x-stagelight {
      position: relative;
      pointer-events: none; /* Let clicks pass through generally */
      --x-stagelight-color: #ffffff;
      --x-stagelight-size: 300px;
      --x-stagelight-intensity: 0.5;
    }

    /* === VARIANT: BEAM === */
    .x-stagelight--beam {
      position: absolute;
      top: 0;
      left: 50%;
      width: 0;
      height: 0;
      z-index: 10;
      /* Swing animation */
      animation: x-beam-swing var(--speed, 3s) ease-in-out infinite alternate;
      transform-origin: top center;
    }

    .x-stagelight__beam {
      position: absolute;
      top: 0;
      left: calc(var(--x-stagelight-size) / -2);
      width: var(--x-stagelight-size);
      height: 100vh; /* Long beam */
      background: linear-gradient(
        to bottom, 
        rgba(255, 255, 255, var(--x-stagelight-intensity)) 0%, 
        var(--x-stagelight-color) 20%, 
        transparent 80%
      );
      /* Make it cone shaped via clip-path or mask */
      clip-path: polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%);
      filter: blur(10px);
      mix-blend-mode: screen;
    }

    .x-stagelight__source {
      position: absolute;
      top: -10px;
      left: -20px;
      width: 40px;
      height: 20px;
      background: #333;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 0 10px var(--x-stagelight-color);
    }

    @keyframes x-beam-swing {
      from { transform: rotate(-15deg); }
      to { transform: rotate(15deg); }
    }

    /* === VARIANT: SPOTLIGHT === */
    /* #647: the HOST element stays in normal flow and keeps its own text.
       It used to BE the overlay (position: fixed, 100vw x 100vh), which meant
       the author's text was dragged into a full-screen layer -- that is the
       "Spotlight effect behind this text" ghost seen at the top-left of the
       Playground. It also left the element contributing zero in-flow size, so
       once contained its demo box collapsed to 0 width and rendered nothing.
       Beam and fixture already build a child for their visuals; spotlight now
       does the same (its old comment claimed an ::after did this -- there was
       no ::after anywhere). */
    .x-stagelight--spotlight {
      position: relative;
      /* A spotlight with zero area is meaningless. The host is often empty
         (the component consumes its text), and inside a single-item demo grid
         "width: fit-content" then resolves to 0 -- the effect had nothing to
         paint on. It previously hid this by covering the whole viewport
         instead, which is the bug. Give it a real canvas by default. */
      min-width: 18rem;
      min-height: 14rem;
    }

    /* The actual overlay. "inset: 0" sizes it to its CONTAINING BLOCK, where
       "width: 100vw; height: 100vh" could not: viewport units are absolute and
       ignore containment, so an ancestor with "contain: layout" could re-anchor
       this layer's origin but never shrink it -- it kept blanketing the page
       from wherever it landed. That is why the first attempt at this bug
       (adding "contain: layout" to the Playground preview) could not have
       worked, quite apart from targeting an element the spotlight was never
       inside.
       Standalone the containing block IS the viewport, so full-screen coverage
       is unchanged; inside a demo box that establishes one, it stays in the box.
       Pairs with ".x-demo__grid { contain: layout }" in
       styles/behaviors/demo.css -- BOTH are required, neither suffices.
       NOTE: this block sits inside a JS template literal -- never use a
       backtick here, it terminates the string. */
    /* #658: off state. Only the OVERLAY is hidden -- the host and its content
       stay visible, which is the whole point of being able to switch the
       effect off and read what is underneath. */
    .x-stagelight--spotlight[data-x-stagelight-off] .x-stagelight__spot {
      display: none;
    }

    .x-stagelight--spotlight {
      cursor: pointer;
    }

    .x-stagelight__spot {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      mix-blend-mode: multiply; /* Darkens everything except the spot */
      /* --x-stagelight-radius is the EFFECTIVE radius: the author's size
         capped to what the box can actually show (set in JS below). A circle
         gradient's radius must be a length -- CSS cannot express "40% of the
         box" here -- so the cap is computed rather than declared. Without it a
         size larger than the box clips the falloff through a single edge and
         only part of the effect is visible. Falls back to the raw size. */
      background: radial-gradient(
        circle at var(--x, 50%) var(--y, 50%), 
        transparent var(--x-stagelight-radius, var(--x-stagelight-size)), 
        rgba(0,0,0,0.85) calc(var(--x-stagelight-radius, var(--x-stagelight-size)) + 50px)
      );
      transition: background 0.1s ease-out; /* Smooth follow */
    }
    
    /* Variant: Spotlight - Screen Mode (Light beam in dark room) */
    .x-stagelight--spotlight.mode-add .x-stagelight__spot {
      mix-blend-mode: screen;
      background: radial-gradient(
        circle at var(--x, 50%) var(--y, 50%), 
        rgba(255,255,255,0.2) 0%, 
        transparent var(--x-stagelight-size)
      );
    }

    /* === VARIANT: FIXTURE === */
    .x-stagelight--fixture {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: 100px;
      pointer-events: auto;
    }

    .x-stagelight__housing {
      width: 60px;
      height: 80px;
      background: #222;
      border-radius: 10px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
      transform-style: preserve-3d;
      transition: transform 0.3s ease;
    }
    
    /* Light Emitter inside fixture */
    .x-stagelight__housing::after {
      content: '';
      width: 40px; 
      height: 40px;
      background: var(--x-stagelight-color);
      border-radius: 50%;
      box-shadow: 0 0 20px var(--x-stagelight-color);
      opacity: var(--x-stagelight-intensity);
    }
    
    .x-stagelight__housing:hover {
       transform: rotateX(-20deg);
    }

    .x-stagelight--fixture span {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary, #888);
      font-family: monospace;
    }
  `;
  document.head.appendChild(style);
}

export default function stagelight(element, options = {}) {
  injectStyles();

  const config = {
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || 'beam',
    color: options.color || element.getAttribute('color') || readAttr(element, 'color') || '#ffffff',
    size: options.size || element.getAttribute('size') || readAttr(element, 'size') || '300px',
    intensity: options.intensity || element.getAttribute('intensity') || readAttr(element, 'intensity') || '0.5',
    speed: options.speed || element.getAttribute('speed') || readAttr(element, 'speed') || '3s',
    target: options.target || element.getAttribute('target') || readAttr(element, 'target') || 'mouse',
    label: options.label || element.getAttribute('label') || readAttr(element, 'label'),
    ...options
  };

  // #448: no classList.add('x-stagelight') -- no CSS selector anywhere
  // depends on the bare class; it just duplicated <div x-stagelight>'s own
  // tag name.

  // === STEP 2: CREATE DOM STRUCTURE BASED ON VARIANT ===
  if (config.variant === 'beam') {
    // Create source (light fixture at top)
    const source = document.createElement('div');
    source.className = 'x-stagelight__source';
    element.appendChild(source);
    
    // Create beam element
    const beam = document.createElement('div');
    beam.className = 'x-stagelight__beam';
    element.appendChild(beam);
  } 
  else if (config.variant === 'fixture') {
    // Create housing (light bulb container)
    const housing = document.createElement('div');
    housing.className = 'x-stagelight__housing';
    element.appendChild(housing);
    
    // Create label if provided
    if (config.label) {
      const label = document.createElement('span');
      label.textContent = config.label;
      element.appendChild(label);
    }
  }
  else if (config.variant === 'spotlight') {
    // #647: the overlay is a CHILD, so the host keeps its own text in normal
    // flow and still gives its demo box real dimensions.
    const spot = document.createElement('div');
    spot.className = 'x-stagelight__spot';
    element.appendChild(spot);
  }

  // Apply CSS Variables
  element.style.setProperty('--x-stagelight-color', config.color);
  element.style.setProperty('--x-stagelight-size', config.size);
  element.style.setProperty('--x-stagelight-intensity', config.intensity);
  element.style.setProperty('--speed', config.speed);

  // Apply Variant Class
  element.classList.add(`x-stagelight--${config.variant}`);

  // === BEHAVIOR LOGIC ===
  
  let cleanup = () => {};
  let spotlightApi = null;

  if (config.variant === 'spotlight') {
    // Mouse Tracking Logic
    // #647: coordinates must be relative to the OVERLAY'S OWN BOX, not the
    // viewport. The overlay is sized by "inset: 0" against its containing
    // block, so once a demo box contains it, its origin is no longer 0,0 of the
    // screen -- feeding raw clientX/clientY put the bright spot outside the box
    // and left it rendering as a uniformly dark rectangle. When nothing
    // contains it the box IS the viewport and rect.left/top are 0, so
    // standalone behaviour is byte-identical to before.
    const overlay = element.querySelector('.x-stagelight__spot');

    // Cap the radius to the box so the WHOLE effect is visible. A spotlight
    // configured at 400px inside a 288x160 demo box could only ever clip
    // through one edge -- the falloff ring fell outside the box entirely.
    // 0.35 of the smaller side leaves room for the ~50px falloff plus margin.
    // Standalone the box is the viewport, where the author's size is almost
    // always the smaller value and therefore wins unchanged.
    const configuredPx = parseFloat(config.size) || 300;
    const syncRadius = () => {
      const r = overlay.getBoundingClientRect();
      const limit = Math.min(r.width, r.height) * 0.35;
      const effective = limit > 0 ? Math.min(configuredPx, limit) : configuredPx;
      element.style.setProperty('--x-stagelight-radius', `${Math.round(effective)}px`);
    };
    syncRadius();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncRadius);
      ro.observe(overlay);
    }

    const onMove = (e) => {
      const rect = overlay.getBoundingClientRect();
      element.style.setProperty('--x', `${e.clientX - rect.left}px`);
      element.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };

    if (config.target === 'mouse') {
      window.addEventListener('mousemove', onMove);
    }

    // #658: let a viewer switch the effect off and read the content plainly.
    // The fixture variant already toggles (click its housing); spotlight had no
    // way to stop, which is an inconsistency between variants of one component.
    let isOn = !element.hasAttribute('off');
    const applyState = () => {
      if (isOn) element.removeAttribute('data-x-stagelight-off');
      else element.setAttribute('data-x-stagelight-off', '');
      element.setAttribute('aria-pressed', String(isOn));
    };
    const toggle = () => { isOn = !isOn; applyState(); };

    // It is an interactive control now, not decoration, so make it reachable
    // and announced rather than mouse-only.
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
    if (!element.hasAttribute('role')) element.setAttribute('role', 'switch');
    if (!element.hasAttribute('aria-label')) {
      element.setAttribute('aria-label', 'Toggle spotlight effect');
    }
    applyState();

    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    };
    element.addEventListener('click', toggle);
    element.addEventListener('keydown', onKey);

    spotlightApi = {
      toggle,
      on: () => { isOn = true; applyState(); },
      off: () => { isOn = false; applyState(); },
      get isOn() { return isOn; },
    };

    cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      element.removeEventListener('click', toggle);
      element.removeEventListener('keydown', onKey);
      if (ro) ro.disconnect();
    };
  } 
  else if (config.variant === 'fixture') {
    // Fixture Logic - Click to toggle
    let isOn = true;
    // Use the housing element we just created
    const housing = element.querySelector('.x-stagelight__housing');
    
    const toggle = () => {
      isOn = !isOn;
      element.style.setProperty('--x-stagelight-intensity', isOn ? config.intensity : '0.1');
    };
    
    housing.addEventListener('click', toggle);
    housing.style.cursor = 'pointer';
    
    cleanup = () => housing.removeEventListener('click', toggle);
  }

  // Expose API
  element.wbStageLight = {
    setColor: (c) => element.style.setProperty('--x-stagelight-color', c),
    setIntensity: (i) => element.style.setProperty('--x-stagelight-intensity', i),
    setSize: (s) => element.style.setProperty('--x-stagelight-size', s)
  };

  // #658: spotlight-only controls. Assigned explicitly rather than spread --
  // object spread would copy `isOn`'s CURRENT value and freeze it, where the
  // caller needs a live read of the toggle state.
  if (spotlightApi) {
    element.wbStageLight.toggle = spotlightApi.toggle;
    element.wbStageLight.on = spotlightApi.on;
    element.wbStageLight.off = spotlightApi.off;
    Object.defineProperty(element.wbStageLight, 'isOn', {
      get: () => spotlightApi.isOn,
      enumerable: true,
    });
  }

  // Return cleanup function
  return () => {
    cleanup();
    element.classList.remove('x-stagelight', `x-stagelight--${config.variant}`);
  };
}
