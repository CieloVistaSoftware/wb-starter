/**
 * Stage Light Component
 * -----------------------------------------------------------------------------
 * Provides three stage lighting effects:
 * 1. Beam: Decorative sweeping beam (CSS animation)
 * 2. Spotlight: Mouse-tracking overlay (fixed positioning)
 * 3. Fixture: UI element representation of a physical light
 * 
 * Usage:
 * <wb-stagelight variant="beam" color="#ff0000"></wb-stagelight>
 * <wb-stagelight variant="spotlight"></wb-stagelight>
 * -----------------------------------------------------------------------------
 */

// Inject styles lazily
function injectStyles() {
  if (document.getElementById('wb-stagelight-styles')) return;

  const style = document.createElement('style');
  style.id = 'wb-stagelight-styles';
  style.textContent = `
    .wb-stagelight {
      position: relative;
      pointer-events: none; /* Let clicks pass through generally */
      --wb-stagelight-color: #ffffff;
      --wb-stagelight-size: 300px;
      --wb-stagelight-intensity: 0.5;
    }

    /* === VARIANT: BEAM === */
    .wb-stagelight--beam {
      position: absolute;
      top: 0;
      left: 50%;
      width: 0;
      height: 0;
      z-index: 10;
      /* Swing animation */
      animation: wb-beam-swing var(--speed, 3s) ease-in-out infinite alternate;
      transform-origin: top center;
    }

    .wb-stagelight__beam {
      position: absolute;
      top: 0;
      left: calc(var(--wb-stagelight-size) / -2);
      width: var(--wb-stagelight-size);
      height: 100vh; /* Long beam */
      background: linear-gradient(
        to bottom, 
        rgba(255, 255, 255, var(--wb-stagelight-intensity)) 0%, 
        var(--wb-stagelight-color) 20%, 
        transparent 80%
      );
      /* Make it cone shaped via clip-path or mask */
      clip-path: polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%);
      filter: blur(10px);
      mix-blend-mode: screen;
    }

    .wb-stagelight__source {
      position: absolute;
      top: -10px;
      left: -20px;
      width: 40px;
      height: 20px;
      background: #333;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 0 10px var(--wb-stagelight-color);
    }

    @keyframes wb-beam-swing {
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
    .wb-stagelight--spotlight {
      position: relative;
      /* A spotlight with zero area is meaningless. The host is often empty
         (the component consumes its text), and inside a single-item demo grid
         "width: fit-content" then resolves to 0 -- the effect had nothing to
         paint on. It previously hid this by covering the whole viewport
         instead, which is the bug. Give it a real canvas by default. */
      min-width: 18rem;
      min-height: 10rem;
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
       Pairs with ".wb-demo__grid { contain: layout }" in
       styles/behaviors/demo.css -- BOTH are required, neither suffices.
       NOTE: this block sits inside a JS template literal -- never use a
       backtick here, it terminates the string. */
    .wb-stagelight__spot {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      mix-blend-mode: multiply; /* Darkens everything except the spot */
      background: radial-gradient(
        circle at var(--x, 50%) var(--y, 50%), 
        transparent var(--wb-stagelight-size), 
        rgba(0,0,0,0.85) calc(var(--wb-stagelight-size) + 50px)
      );
      transition: background 0.1s ease-out; /* Smooth follow */
    }
    
    /* Variant: Spotlight - Screen Mode (Light beam in dark room) */
    .wb-stagelight--spotlight.mode-add .wb-stagelight__spot {
      mix-blend-mode: screen;
      background: radial-gradient(
        circle at var(--x, 50%) var(--y, 50%), 
        rgba(255,255,255,0.2) 0%, 
        transparent var(--wb-stagelight-size)
      );
    }

    /* === VARIANT: FIXTURE === */
    .wb-stagelight--fixture {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: 100px;
      pointer-events: auto;
    }

    .wb-stagelight__housing {
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
    .wb-stagelight__housing::after {
      content: '';
      width: 40px; 
      height: 40px;
      background: var(--wb-stagelight-color);
      border-radius: 50%;
      box-shadow: 0 0 20px var(--wb-stagelight-color);
      opacity: var(--wb-stagelight-intensity);
    }
    
    .wb-stagelight__housing:hover {
       transform: rotateX(-20deg);
    }

    .wb-stagelight--fixture span {
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
    variant: options.variant || element.getAttribute('variant') || element.dataset.variant || 'beam',
    color: options.color || element.getAttribute('color') || element.dataset.color || '#ffffff',
    size: options.size || element.getAttribute('size') || element.dataset.size || '300px',
    intensity: options.intensity || element.getAttribute('intensity') || element.dataset.intensity || '0.5',
    speed: options.speed || element.getAttribute('speed') || element.dataset.speed || '3s',
    target: options.target || element.getAttribute('target') || element.dataset.target || 'mouse',
    label: options.label || element.getAttribute('label') || element.dataset.label,
    ...options
  };

  // #448: no classList.add('wb-stagelight') -- no CSS selector anywhere
  // depends on the bare class; it just duplicated <wb-stagelight>'s own
  // tag name.

  // === STEP 2: CREATE DOM STRUCTURE BASED ON VARIANT ===
  if (config.variant === 'beam') {
    // Create source (light fixture at top)
    const source = document.createElement('div');
    source.className = 'wb-stagelight__source';
    element.appendChild(source);
    
    // Create beam element
    const beam = document.createElement('div');
    beam.className = 'wb-stagelight__beam';
    element.appendChild(beam);
  } 
  else if (config.variant === 'fixture') {
    // Create housing (light bulb container)
    const housing = document.createElement('div');
    housing.className = 'wb-stagelight__housing';
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
    spot.className = 'wb-stagelight__spot';
    element.appendChild(spot);
  }

  // Apply CSS Variables
  element.style.setProperty('--wb-stagelight-color', config.color);
  element.style.setProperty('--wb-stagelight-size', config.size);
  element.style.setProperty('--wb-stagelight-intensity', config.intensity);
  element.style.setProperty('--speed', config.speed);

  // Apply Variant Class
  element.classList.add(`wb-stagelight--${config.variant}`);

  // === BEHAVIOR LOGIC ===
  
  let cleanup = () => {};

  if (config.variant === 'spotlight') {
    // Mouse Tracking Logic
    // #647: coordinates must be relative to the OVERLAY'S OWN BOX, not the
    // viewport. The overlay is sized by "inset: 0" against its containing
    // block, so once a demo box contains it, its origin is no longer 0,0 of the
    // screen -- feeding raw clientX/clientY put the bright spot outside the box
    // and left it rendering as a uniformly dark rectangle. When nothing
    // contains it the box IS the viewport and rect.left/top are 0, so
    // standalone behaviour is byte-identical to before.
    const overlay = element.querySelector('.wb-stagelight__spot');
    const onMove = (e) => {
      const rect = overlay.getBoundingClientRect();
      element.style.setProperty('--x', `${e.clientX - rect.left}px`);
      element.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };

    if (config.target === 'mouse') {
      window.addEventListener('mousemove', onMove);
      cleanup = () => window.removeEventListener('mousemove', onMove);
    }
  } 
  else if (config.variant === 'fixture') {
    // Fixture Logic - Click to toggle
    let isOn = true;
    // Use the housing element we just created
    const housing = element.querySelector('.wb-stagelight__housing');
    
    const toggle = () => {
      isOn = !isOn;
      element.style.setProperty('--wb-stagelight-intensity', isOn ? config.intensity : '0.1');
    };
    
    housing.addEventListener('click', toggle);
    housing.style.cursor = 'pointer';
    
    cleanup = () => housing.removeEventListener('click', toggle);
  }

  // Expose API
  element.wbStageLight = {
    setColor: (c) => element.style.setProperty('--wb-stagelight-color', c),
    setIntensity: (i) => element.style.setProperty('--wb-stagelight-intensity', i),
    setSize: (s) => element.style.setProperty('--wb-stagelight-size', s)
  };

  // Return cleanup function
  return () => {
    cleanup();
    element.classList.remove('wb-stagelight', `wb-stagelight--${config.variant}`);
  };
}
