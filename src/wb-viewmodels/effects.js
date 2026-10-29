import { setRule, clearRules } from '../core/dynamic-style.js';
import { isThemeColor } from '../core/theme-color.js';

/**
 * Effects Behavior
 * -----------------------------------------------------------------------------
 * CSS-based animation utilities triggered by events or on load.
 * Supports standard animations like fade, slide, bounce, and shake.
 * 
 * Usage:
 *   <div x-fadein>...</div>
 *   <button x-shake data-trigger="hover">Shake Me</button>
 * -----------------------------------------------------------------------------
 */

/**
 * Every @keyframes shipped in src/styles/ is kebab-cased and x-prefixed
 * (x-fade-in, x-slide-in-left, x-zoom-in). An animation-name that matches no
 * @keyframes is NOT a CSS error -- the property holds the value, getComputedStyle
 * reports it, and nothing whatsoever animates. So a single wrong character here
 * is invisible in the browser and invisible to any test that only asks whether
 * animation-name is set (#860, and #847 before it, which shipped the whole
 * `wb-` prefix against `x-*` keyframes and went unnoticed).
 *
 * `animation="fadeIn"` and `animation="slideInLeft"` are the spellings an author
 * naturally reaches for -- they are the names every other animation library uses
 * -- so accept them and normalise, rather than silently producing x-fadeIn and
 * animating nothing. (#849)
 */
function kebab(name) {
  return String(name).trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Kebab-casing covers the whole declared enum except one: `rubberBand`'s
 * keyframe is `x-rubberband`, a single word. Listed rather than special-cased
 * so the next mismatch is one line, not another branch.
 *
 * `slideOut` needs no alias: effects.css defines the bare `x-slide-out` it
 * kebab-cases to (x-animate animation="slideOut") and the four
 * x-slide-out-{dir} keyframes slideout() builds. Neither existed once, which
 * made both dead controls (#866) -- an animation-name matching nothing
 * renders nothing, silently. tests/behaviors/effects-actions.spec.ts now
 * plays every declared animationType.
 */
const KEYFRAME_ALIASES = { 'rubber-band': 'rubberband' };

function keyframeFor(name) {
  const k = kebab(name);
  return `x-${KEYFRAME_ALIASES[k] || k}`;
}

/**
 * Animate - General animation trigger
 * Helper Attribute: [x-animate]
 */
export function animate(element, options = {}) {
  const config = {
    // #849: was 'fadeIn', which concatenated to `x-fadeIn` below -- no such
    // keyframe exists, so <div x-animate> with no `animation` attribute has
    // never animated. The keyframe is `x-fade-in`.
    animation: options.animation || element.getAttribute('animation') || 'fade-in',
    duration: options.duration || element.getAttribute('duration') || '0.5s',
    delay: options.delay || element.getAttribute('delay') || '0s',
    easing: options.easing || element.getAttribute('easing') || 'ease',
    trigger: options.trigger || element.getAttribute('trigger') || 'click',
    ...options
  };

  element.classList.add('x-animate');

  const keyframe = keyframeFor(config.animation);

  // duration/easing are author values, so the animation travels as a
  // generated rule (#779). Clearing it, forcing a reflow, then setting it again
  // is what restarts a CSS animation that already ran once.
  const play = () => {
    setRule(element, 'anim', null);
    void element.offsetWidth;
    setRule(element, 'anim', { animation: `${keyframe} ${config.duration} ${config.easing}` });
  };

  // All buttons trigger on click
  if (element.tagName === 'BUTTON') {
    element.onclick = play;
  } else if (config.trigger === 'load') {
    play();
  } else if (config.trigger === 'click') {
    element.classList.add('x-animate--clickable');
    element.onclick = play;
  }

  element.wbAnimate = { play };
  return () => {
    clearRules(element);
    element.classList.remove('x-animate', 'x-animate--clickable');
  };
}

// Helper for click-triggered animations.
//
// The class and the keyframe are separate names (#1096). The class is the
// behavior's own, x-{behavior} -- `x-fadein` for fadein() -- so an author who
// knows the behavior can write `.x-fadein` without opening this file. The
// keyframe keeps its kebab-cased name (`x-fade-in`), which dialog.css,
// overlays.css and the rest already play. They were one string once, so the
// element carried the keyframe's name, a shape the naming convention has no
// slot for.
//
// `classes` is the host class plus any modifier (`x-slidein--left`).
function clickAnim(element, classes, keyframe, duration = '0.5s') {
  element.classList.add(...classes);
  // A generated rule, not element.style (#779): cleared, reflowed and set
  // again so a second click replays the animation.
  const playAnimation = () => {
    setRule(element, 'anim', null);
    void element.offsetWidth;
    setRule(element, 'anim', { animation: `${keyframe} ${duration} ease` });
  };
  element.onclick = playAnimation;
  element.wbAnim = { play: playAnimation };
  return () => {
    clearRules(element);
    element.classList.remove(...classes);
  };
}

// Entrances - work on click for buttons
/**
 * Fade In
 * Helper Attribute: [x-fadein]
 */
export function fadein(element) { return clickAnim(element, ['x-fadein'], 'x-fade-in', '0.5s'); }
/**
 * Fade Out
 * Helper Attribute: [x-fadeout]
 */
export function fadeout(element) { return clickAnim(element, ['x-fadeout'], 'x-fade-out', '0.5s'); }
/**
 * Slide In
 * Helper Attribute: [x-slidein]
 *
 * `direction` picks the keyframe the element enters along; the class records
 * it as a modifier of the slidein block, x-slidein--{direction}.
 */
export function slidein(element, options = {}) {
  const dir = options.direction || element.getAttribute('direction') || 'left';
  return clickAnim(element, ['x-slidein', `x-slidein--${dir}`], `x-slide-in-${dir}`, '0.5s');
}
export function slideout(element, options = {}) {
  const dir = options.direction || element.getAttribute('direction') || 'left';
  return clickAnim(element, ['x-slideout', `x-slideout--${dir}`], `x-slide-out-${dir}`, '0.5s');
}
export function zoomin(element) { return clickAnim(element, ['x-zoomin'], 'x-zoom-in', '0.4s'); }
export function zoomout(element) { return clickAnim(element, ['x-zoomout'], 'x-zoom-out', '0.4s'); }
export function flip(element) { return clickAnim(element, ['x-flip'], 'x-flip', '0.6s'); }
export function rotate(element) { return clickAnim(element, ['x-rotate'], 'x-rotate', '0.6s'); }

// Attention seekers
export function bounce(element) { return clickAnim(element, ['x-bounce'], 'x-bounce', '0.75s'); }
export function shake(element) { return clickAnim(element, ['x-shake'], 'x-shake', '0.5s'); }
export function pulse(element) { return clickAnim(element, ['x-pulse'], 'x-pulse', '0.5s'); }
export function flash(element) { return clickAnim(element, ['x-flash'], 'x-flash', '0.75s'); }
export function tada(element) { return clickAnim(element, ['x-tada'], 'x-tada', '1s'); }
export function wobble(element) { return clickAnim(element, ['x-wobble'], 'x-wobble', '1s'); }
export function jello(element) { return clickAnim(element, ['x-jello'], 'x-jello', '1s'); }
export function swing(element) { return clickAnim(element, ['x-swing'], 'x-swing', '0.75s'); }
export function rubberband(element) { return clickAnim(element, ['x-rubberband'], 'x-rubberband', '1s'); }
export function heartbeat(element) { return clickAnim(element, ['x-heartbeat'], 'x-heartbeat', '1.3s'); }

/**
 * Reveal - Fade in when scrolled into view
 */
export function reveal(element, options = {}) {
  const config = {
    threshold: parseFloat(options.threshold || element.getAttribute('threshold') || '0.1'),
    once: options.once ?? element.getAttribute('once') !== 'false',
  };
  
  // Hidden start state and the transition are .x-reveal in effects.css; the
  // revealed state is .x-reveal--visible (#779).
  element.classList.add('x-reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        element.classList.add('x-reveal--visible');
        if (config.once) observer.disconnect();
      }
    });
  }, { threshold: config.threshold });
  
  observer.observe(element);
  return () => { observer.disconnect(); element.classList.remove('x-reveal', 'x-reveal--visible'); };
}

/**
 * #760 -- John: "glowing buttons must emulate a click when pressed this means
 * the user has to be fooled the button went down and then returned."
 *
 * The continuous effects -- glow, rainbow, particle -- run an infinite
 * animation and bind no click handler. On a <button> that reads as broken:
 * something that looks pressable, pressed, and did not move.
 *
 * This gives the press back. It is deliberately NOT a click handler -- the
 * behavior still does not DO anything on click, and pretending otherwise
 * would be the same lie as a button labelled "Download report" that downloads
 * nothing. What it restores is the physical feedback: down on press, back on
 * release.
 *
 * Held for a minimum duration because a real click is faster than the eye:
 * pointerdown and pointerup can land in the same frame, the class goes on and
 * off before a single paint, and nothing is seen. 120ms is long enough to
 * register and short enough not to feel laggy.
 *
 * #1096: the class is the calling behavior's own modifier, x-glow--pressed,
 * x-rainbow--pressed or x-particle--pressed, so its name follows from the
 * behavior. The caller passes `setPressed`, which toggles that class, so each
 * name is written out where the behavior is.
 *
 * @param {HTMLElement} element
 * @param {(down: boolean) => void} setPressed  puts the pressed class on or takes it off
 */
function addPressFeedback(element, setPressed) {
  const PRESS_MS = 120;
  let pressedAt = 0;
  let releaseTimer = null;

  const down = () => {
    pressedAt = Date.now();
    clearTimeout(releaseTimer);
    setPressed(true);
  };

  const up = () => {
    const held = Date.now() - pressedAt;
    const wait = Math.max(0, PRESS_MS - held);
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => setPressed(false), wait);
  };

  element.addEventListener('pointerdown', down);
  element.addEventListener('pointerup', up);
  // Releasing outside the element, or losing the pointer entirely, must still
  // let it come back up -- otherwise it stays visually held down for good.
  element.addEventListener('pointerleave', up);
  element.addEventListener('pointercancel', up);
  // Keyboard activation is a press too: Space/Enter on a focused button.
  element.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(); });
  element.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });

  return () => {
    clearTimeout(releaseTimer);
    setPressed(false);
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointerleave', up);
    element.removeEventListener('pointercancel', up);
  };
}

/**
 * Glow - Pulsing glow effect
 */
export function glow(element, options = {}) {
  // The animation and the three-ring shadow are .x-glow in effects.css,
  // reading --glow-color (#779, #906). With no color the element writes
  // NOTHING, so a theme's --glow-color reaches it; only an author-supplied
  // colour travels, as a generated rule. Teardown removes both, so a
  // destroyed glow actually stops glowing.
  const color = options.color || element.getAttribute('color');
  // #816: target="text" glows the letters (text-shadow, steady); the default
  // "box" haloes the element and pulses. Both are classes in effects.css.
  const target = (options.target || element.getAttribute('target') || 'box') === 'text' ? 'text' : 'box';
  element.classList.add('x-glow');
  if (target === 'text') element.classList.add('x-glow--text');
  // #907: a theme name (color="success") is matched by effects.css's
  // .x-glow[color="…"] rules, so it writes nothing at all. Only a colour CSS
  // cannot enumerate (#ff00aa, rgb(), hsl()) travels, as a generated rule.
  if (color && !isThemeColor(color)) setRule(element, 'glow', { '--glow-color': color });

  const releasePress = addPressFeedback(element, (down) => element.classList.toggle('x-glow--pressed', down));

  return () => { releasePress(); clearRules(element); element.classList.remove('x-glow', 'x-glow--text'); };
}

// confetti, typewriter, countup, parallax, marquee, sparkle, rainbow,
// fireworks, snow and particle are WB Pro behaviors (#1953): they live in the
// private wb-pro pack and register through registerBehaviorPack().

// Export all
export default {
  animate, fadein, fadeout, slidein, slideout, zoomin, zoomout,
  flip, rotate, bounce, shake, pulse, flash, tada, wobble, jello,
  swing, rubberband, heartbeat, reveal, glow
};
