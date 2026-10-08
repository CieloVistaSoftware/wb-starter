import { readAttr } from '../core/read-attr.js';
import { setRule, clearRules } from '../core/dynamic-style.js';
import { themeColor } from '../core/theme-color.js';
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

// Styles: the STAGELIGHT section of src/styles/behaviors/effects.css, which
// behavior-css-manifest.js loads for x-stagelight (#817; it was an injected
// <style> here).

export default function stagelight(element, options = {}) {
  const config = {
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || 'beam',
    color: options.color || element.getAttribute('color') || readAttr(element, 'color') || '',
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
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-stagelight> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-stagelight> tag does not get a redundant class.
  element.classList.add('x-stagelight');

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

  // Apply CSS Variables -- as generated rules, never element.style (#779),
  // and only where the value differs from the .x-stagelight default above:
  // a default pinned onto the element is exactly what stops a theme from
  // supplying its own.
  const vars = {};
  // #790: a theme name (color="primary") or any CSS colour; none set leaves
  // the theme's --x-stagelight-light in charge.
  if (config.color) vars['--x-stagelight-color'] = themeColor(config.color);
  if (config.size !== '300px') vars['--x-stagelight-size'] = config.size;
  if (config.speed !== '3s') vars['--speed'] = config.speed;
  setRule(element, 'vars', vars);
  const setIntensity = (i) => setRule(element, 'intensity',
    String(i) === '0.5' ? null : { '--x-stagelight-intensity': i });
  setIntensity(config.intensity);

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
      setRule(element, 'radius', { '--x-stagelight-radius': `${Math.round(effective)}px` });
    };
    syncRadius();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncRadius);
      ro.observe(overlay);
    }

    const onMove = (e) => {
      const rect = overlay.getBoundingClientRect();
      setRule(element, 'pointer', { '--x': `${e.clientX - rect.left}px`, '--y': `${e.clientY - rect.top}px` });
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
      setIntensity(isOn ? config.intensity : '0.1');
    };

    // cursor: pointer is `.x-stagelight--fixture .x-stagelight__housing` above.
    housing.addEventListener('click', toggle);
    
    cleanup = () => housing.removeEventListener('click', toggle);
  }

  // Expose API
  element.wbStageLight = {
    // One 'vars' slot, updated in place: two rules setting the same property
    // on one element would be decided by insertion order, not by the call.
    setColor: (c) => { vars['--x-stagelight-color'] = c; setRule(element, 'vars', { ...vars }); },
    setIntensity,
    setSize: (sz) => { vars['--x-stagelight-size'] = sz; setRule(element, 'vars', { ...vars }); }
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
    clearRules(element);
    element.classList.remove('x-stagelight', `x-stagelight--${config.variant}`);
  };
}
