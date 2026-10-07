import { readFlag } from '../core/read-attr.js';
import { setRule, clearRules, clearRulesIn } from '../core/dynamic-style.js';
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

// Helper for click-triggered animations
function clickAnim(element, animName, duration = '0.5s') {
  element.classList.add(`x-${animName}`);
  // A generated rule, not element.style (#779): cleared, reflowed and set
  // again so a second click replays the animation.
  const playAnimation = () => {
    setRule(element, 'anim', null);
    void element.offsetWidth;
    setRule(element, 'anim', { animation: `x-${animName} ${duration} ease` });
  };
  if (element.tagName === 'BUTTON') {
    element.onclick = playAnimation;
  } else {
    element.onclick = playAnimation;
  }
  element.wbAnim = { play: playAnimation };
  return () => {
    clearRules(element);
    element.classList.remove(`x-${animName}`);
  };
}

// Entrances - work on click for buttons
/**
 * Fade In
 * Helper Attribute: [x-fadein]
 */
export function fadein(element) { return clickAnim(element, 'fade-in', '0.5s'); }
/**
 * Fade Out
 * Helper Attribute: [x-fadeout]
 */
export function fadeout(element) { return clickAnim(element, 'fade-out', '0.5s'); }
/**
 * Slide In
 * Helper Attribute: [x-slidein]
 */
export function slidein(element, options = {}) {
  const dir = options.direction || element.getAttribute('direction') || 'left';
  return clickAnim(element, `slide-in-${dir}`, '0.5s');
}
export function slideout(element, options = {}) {
  const dir = options.direction || element.getAttribute('direction') || 'left';
  return clickAnim(element, `slide-out-${dir}`, '0.5s');
}
export function zoomin(element) { return clickAnim(element, 'zoom-in', '0.4s'); }
export function zoomout(element) { return clickAnim(element, 'zoom-out', '0.4s'); }
export function flip(element) { return clickAnim(element, 'flip', '0.6s'); }
export function rotate(element) { return clickAnim(element, 'rotate', '0.6s'); }

// Attention seekers
export function bounce(element) { return clickAnim(element, 'bounce', '0.75s'); }
export function shake(element) { return clickAnim(element, 'shake', '0.5s'); }
export function pulse(element) { return clickAnim(element, 'pulse', '0.5s'); }
export function flash(element) { return clickAnim(element, 'flash', '0.75s'); }
export function tada(element) { return clickAnim(element, 'tada', '1s'); }
export function wobble(element) { return clickAnim(element, 'wobble', '1s'); }
export function jello(element) { return clickAnim(element, 'jello', '1s'); }
export function swing(element) { return clickAnim(element, 'swing', '0.75s'); }
export function rubberband(element) { return clickAnim(element, 'rubberband', '1s'); }
export function heartbeat(element) { return clickAnim(element, 'heartbeat', '1.3s'); }

/**
 * Particle colours from a declared `colors` attribute.
 *
 * confetti.schema.json and fireworks.schema.json both declare `colors` as
 * "Particle colors as JSON array" with a JSON-array default -- and both
 * hard-coded their palettes instead, so the attribute was documented and
 * inert (#861). One parser, used by both: a second copy is how the two
 * palettes would drift apart.
 *
 * Tolerant by design. A palette is decoration, so a malformed value falls back
 * to the built-in rather than throwing and killing the whole effect. Accepts
 * a JSON array (as the schema says) or a plain comma-separated list, because
 * `colors="red, blue"` is what people actually type.
 *
 * @param {string} raw attribute value
 * @param {string[]} fallback palette to use when raw is absent or unusable
 * @returns {string[]}
 */
export function parseColorList(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  const text = raw.trim();
  if (!text) return fallback;
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string' && c.trim()) : [];
      return list.length ? list : fallback;
    } catch {
      return fallback;
    }
  }
  const list = text.split(',').map((c) => c.trim()).filter(Boolean);
  return list.length ? list : fallback;
}

/** "3s" / "250ms" / "3" -> milliseconds (0 when unparseable). */
function toMs(v) {
  if (typeof v === 'number') return v;
  const m = String(v).trim().match(/^([\d.]+)\s*(ms|s)?$/);
  if (!m) return 0;
  return m[2] === 'ms' ? parseFloat(m[1]) : parseFloat(m[1]) * 1000;
}

/**
 * The unattended-loop contract confetti, fireworks and snow all declare:
 * `repeat` fires the burst on its own, first after `delay`, then once every
 * `duration`. The timers are owned here and cleared by stop(), so a removed
 * element cannot leave an interval appending containers to <body> forever
 * (#655). One copy, so the three effects cannot drift apart.
 *
 * @param {() => void} fire
 * @param {{ delay: string|number, duration: string|number }} config
 * @param {number} fallbackMs interval when `duration` is unparseable
 */
function repeatLoop(fire, config, fallbackMs) {
  let repeatTimer = null;
  let startTimer = null;
  const stop = () => {
    if (repeatTimer !== null) { clearInterval(repeatTimer); repeatTimer = null; }
    if (startTimer !== null) { clearTimeout(startTimer); startTimer = null; }
  };
  const start = () => {
    stop();
    const every = Math.max(toMs(config.duration) || fallbackMs, 500);
    startTimer = setTimeout(() => {
      fire();
      repeatTimer = setInterval(fire, every);
    }, toMs(config.delay));
  };
  return { start, stop };
}

/**
 * Confetti - Explosion of colorful particles (VISIBLE BUTTON)
 * Helper Attribute: [x-confetti]
 */
export function confetti(element, options = {}) {
  const config = {
    count: parseInt(options.count || element.getAttribute('count') || '50'),
    label: options.label || element.getAttribute('label') || 'Fire Confetti!',
    // No `repeat`. It looped a burst every few seconds, forever, with no
    // control on the page to stop it -- John: "no way to stop it. remove
    // x-confetti with repeat option." Confetti fires on click or fire().
    // Schema calls these strings ("3s"); accept a bare number of ms too.
    duration: options.duration || element.getAttribute('duration') || '3s',
    delay: options.delay || element.getAttribute('delay') || '0s',
    // Declared in confetti.schema.json as a JSON array; see parseColorList.
    colors: options.colors || element.getAttribute('colors') || '',
    // Declared (default true) but never read: show-button="false" keeps the
    // effect (click, wbConfetti.fire()) without the button chrome.
    showButton: options.showButton ?? readFlag(element, 'show-button', true),
    ...options
  };

  element.classList.add('x-confetti--trigger');
  // #448: no classList.add('x-confetti') -- it just duplicated
  // <div x-confetti>'s own tag name; no CSS selector depends on the bare class
  // (only .x-confetti--trigger/-piece, unaffected).
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-confetti> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-confetti> tag does not get a redundant class.
  element.classList.add('x-confetti');

  // MAKE IT VISIBLE! Render as a button if empty
  if (config.showButton && !element.textContent.trim()) {
    element.innerHTML = `<span>🎉</span><span>${config.label}</span>`;
  }

  // The button chrome and its hover lift live in effects.css under
  // .x-confetti--trigger-button (#779) -- a stylesheet rule a theme can reach,
  // and a :hover the browser tracks, instead of cssText plus two handlers.
  if (config.showButton) element.classList.add('x-confetti--trigger-button');

  // Inject CSS keyframes if not present
  if (!document.getElementById('x-confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'x-confetti-styles';
    style.textContent = `
      @keyframes x-confetti-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes x-confetti-fall {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) translateX(var(--end-x, 0)) rotate(var(--rotation, 720deg)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    // Create container
    const container = document.createElement('div');
    container.className = 'x-confetti-container';
    
    // Create particles
    const colors = parseColorList(
      config.colors,
      ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'],
    );
    for (let i = 0; i < config.count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startX = 50 + (Math.random() - 0.5) * 20;
      const endX = startX + (Math.random() - 0.5) * 100;
      const rotation = Math.random() * 720;
      const duration = 2 + Math.random() * 2;
      
      // Shared declarations are .x-confetti-piece in effects.css; only the
      // random per-piece values travel, as a generated rule (#779).
      particle.className = 'x-confetti-piece';
      setRule(particle, 'piece', {
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        left: `${startX}%`,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
        animationDuration: `${duration}s`,
        animationDelay: `${Math.random() * 0.3}s`,
        '--end-x': `${endX - startX}vw`,
        '--rotation': `${rotation}deg`,
      });
      container.appendChild(particle);
    }
    
    document.body.appendChild(container);
    setTimeout(() => { clearRulesIn(container); container.remove(); }, 5000);
  };
  
  element.onclick = fire;

  element.wbConfetti = { fire };
  return () => {
    element.classList.remove('x-confetti--trigger', 'x-confetti--trigger-button');
  };
}

/**
 * Typewriter - Types out text character by character
 * Helper Attribute: [x-typewriter]
 */
export function typewriter(element, options = {}) {
  const config = {
    text: options.text || element.getAttribute('text') || element.textContent || 'Hello World!',
    speed: parseInt(options.speed || element.getAttribute('speed') || '50'),
    cursor: options.cursor ?? element.getAttribute('cursor') !== 'false',
  };
  
  element.classList.add('x-typewriter');
  
  const type = () => {
    element.textContent = '';
    // The caret is .x-typewriter--cursor in effects.css (#779).
    element.classList.toggle('x-typewriter--cursor', !!config.cursor);
    let i = 0;
    
    const typeChar = () => {
      if (i < config.text.length) {
        element.textContent += config.text.charAt(i);
        i++;
        setTimeout(typeChar, config.speed);
      }
    };
    typeChar();
  };
  
  // A <button> starts blank until the first click (a deliberate reveal
  // interaction); every other element auto-plays on load. Previously ONLY
  // the button case ever got a click handler at all -- any other tag (e.g.
  // <h3 x-typewriter>) typed once on load and then just sat there; clicking
  // it did nothing, confirmed live via the Playground. Click-to-restart is
  // a reasonable expectation for a typing effect regardless of host tag, so
  // it's now wired for every element; only the "auto-play on load" part
  // stays button-specific. (#537)
  if (element.tagName !== 'BUTTON') {
    type();
  }
  // cursor: pointer comes from .x-typewriter in effects.css (#779).
  element.addEventListener('click', type);

  element.wbTypewriter = { type };
  return () => {
    element.classList.remove('x-typewriter', 'x-typewriter--cursor');
    element.removeEventListener('click', type);
  };
}

/**
 * Countup - Animated number counter
 */
export function countup(element, options = {}) {
  const config = {
    start: parseFloat(options.start || element.getAttribute('from') || '0'),
    end: parseFloat(options.end || element.getAttribute('to') || element.textContent || '100'),
    duration: parseInt(options.duration || element.getAttribute('duration') || '2000'),
    prefix: options.prefix || element.getAttribute('prefix') || '',
    suffix: options.suffix || element.getAttribute('suffix') || '',
    decimals: parseInt(options.decimals || element.getAttribute('decimals') || '0'),
  };
  
  element.classList.add('x-countup');
  
  const count = () => {
    const startTime = performance.now();
    const range = config.end - config.start;
    
    const update = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / config.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = config.start + (range * eased);
      element.textContent = config.prefix + value.toFixed(config.decimals) + config.suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        count();
        observer.disconnect();
      }
    });
  });
  observer.observe(element);
  
  element.wbCountup = { count };
  return () => { observer.disconnect(); element.classList.remove('x-countup'); };
}

/**
 * Parallax - Scroll-based movement
 */
export function parallax(element, options = {}) {
  const speed = parseFloat(options.speed || element.getAttribute('speed') || '0.5');
  element.classList.add('x-parallax');
  
  let ticking = false;

  const updateFn = () => {
    const rect = element.getBoundingClientRect();
    const offset = (window.innerHeight - rect.top) * speed * 0.1;
    // Measured on every scroll, so a generated rule rather than a static
    // class -- never element.style (#779).
    setRule(element, 'parallax', { transform: `translateY(${offset}px)` });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateFn);
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  updateFn();
  
  return () => {
    window.removeEventListener('scroll', onScroll);
    clearRules(element);
    element.classList.remove('x-parallax');
  };
}

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
 * Marquee - Scrolling text
 */
export function marquee(element, options = {}) {
  const speed = parseInt(options.speed || element.getAttribute('speed') || '30');
  element.classList.add('x-marquee');
  
  const content = element.innerHTML;
  element.innerHTML = '';
  // Layout is .x-marquee / .x-marquee__track in effects.css; only the
  // author's speed travels, as a generated rule the track reads (#779).
  setRule(element, 'speed', { '--x-marquee-speed': `${speed}s` });

  for (let i = 0; i < 2; i++) {
    const span = document.createElement('span');
    span.className = 'x-marquee__track';
    span.innerHTML = content + '&nbsp;&nbsp;&nbsp;';
    element.appendChild(span);
  }

  return () => { clearRules(element); element.classList.remove('x-marquee'); };
}

/**
 * Sparkle - Sparkle particles around element
 */
export function sparkle(element, options = {}) {
  const count = parseInt(options.count || element.getAttribute('count') || '15');
  element.classList.add('x-sparkle--trigger');
  element.classList.add('x-sparkle');
  // position/overflow: .x-sparkle--trigger in effects.css (#779).
  
  // Inject sparkle keyframes
  if (!document.getElementById('x-sparkle-styles')) {
    const style = document.createElement('style');
    style.id = 'x-sparkle-styles';
    style.textContent = `
      @keyframes x-sparkle {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < count; i++) {
          const spark = document.createElement('span');
          const angle = (i / count) * Math.PI * 2 + (wave * 0.3);
          const distance = 50 + Math.random() * 60;
          const size = 12 + Math.random() * 16;
          const duration = 0.8 + Math.random() * 0.4;
          
          const sparkles = ['✨', '⭐', '🌟'];
          spark.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
          // Static part: .x-sparkle__spark in effects.css. The random
          // per-spark values travel as a generated rule (#779).
          spark.className = 'x-sparkle__spark';
          setRule(spark, 'spark', {
            fontSize: `${size / 16}rem`,
            animationDuration: `${duration}s`,
            '--end-x': `${Math.cos(angle) * distance}px`,
            '--end-y': `${Math.sin(angle) * distance}px`,
          });
          element.appendChild(spark);
          setTimeout(() => { clearRules(spark); spark.remove(); }, duration * 1000);
        }
      }, wave * 150);
    }
  };
  
  element.onclick = fire;
  element.wbSparkle = { fire };
  return () => element.classList.remove('x-sparkle--trigger');
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
 */
function addPressFeedback(element) {
  const PRESS_MS = 120;
  let pressedAt = 0;
  let releaseTimer = null;

  const down = () => {
    pressedAt = Date.now();
    clearTimeout(releaseTimer);
    element.classList.add('x-pressed');
  };

  const up = () => {
    const held = Date.now() - pressedAt;
    const wait = Math.max(0, PRESS_MS - held);
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => element.classList.remove('x-pressed'), wait);
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
    element.classList.remove('x-pressed');
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

  const releasePress = addPressFeedback(element);

  return () => { releasePress(); clearRules(element); element.classList.remove('x-glow', 'x-glow--text'); };
}

/**
 * Rainbow - Cycling rainbow text
 */
export function rainbow(element, options = {}) {
  const duration = options.duration || element.getAttribute('duration');
  element.classList.add('x-rainbow');
  
  // Inject rainbow keyframes
  if (!document.getElementById('x-rainbow-styles')) {
    const style = document.createElement('style');
    style.id = 'x-rainbow-styles';
    style.textContent = `
      @keyframes x-rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Gradient text and its animation are .x-rainbow in effects.css (#779);
  // only an author-supplied duration travels, as a generated rule.
  if (duration) setRule(element, 'rainbow', { '--x-rainbow-duration': duration });

  const releasePress = addPressFeedback(element);
  return () => {
    releasePress();
    clearRules(element);
    element.classList.remove('x-rainbow');
  };
}

/**
 * Fireworks - Burst of particles
 */
export function fireworks(element, options = {}) {
  const count = parseInt(options.count || element.getAttribute('count') || '30');
  // Declared in fireworks.schema.json as a JSON array; see parseColorList.
  const colorSpec = options.colors || element.getAttribute('colors') || '';
  // show-button/repeat/delay/duration are declared in fireworks.schema.json
  // and were never read -- same contract as confetti (#655).
  const config = {
    showButton: options.showButton ?? readFlag(element, 'show-button', true),
    repeat: options.repeat ?? readFlag(element, 'repeat'),
    delay: options.delay || element.getAttribute('delay') || '0s',
    duration: options.duration || element.getAttribute('duration') || '1.5s',
  };
  // The burst lasts `duration`; each particle flies for 2/3 of it, which is
  // the 1s-of-1.5s split the default has always used.
  const burstMs = toMs(config.duration) || 1500;
  element.classList.add('x-fireworks--trigger');
  // #448: no classList.add('x-fireworks') -- it just duplicated
  // <div x-fireworks>'s own tag name; no CSS selector depends on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-fireworks> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-fireworks> tag does not get a redundant class.
  element.classList.add('x-fireworks');

  // Make visible
  if (config.showButton && !element.textContent.trim()) {
    element.innerHTML = '🎆 <span>Fireworks!</span>';
  }
  // #486: vertical padding floored at 1rem (16px) -- Standard §13 requires
  // >=1rem padding on every side of a button's text; 0.75rem (12px) failed
  // demo-layout-standards.spec.ts on pages/behaviors.html's "🎆 Fireworks"
  // trigger. The chrome is .x-fireworks--trigger-button in effects.css
  // (#779): a rule a theme can reach, not a cssText that beats every rule.
  if (config.showButton) element.classList.add('x-fireworks--trigger-button');

  // Inject keyframes
  if (!document.getElementById('x-firework-styles')) {
    const style = document.createElement('style');
    style.id = 'x-firework-styles';
    style.textContent = `
      @keyframes x-firework-particle {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--end-x), var(--end-y)) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Fix: create container
    const animContainer = document.createElement('div');
    animContainer.className = 'x-fireworks-container';
    
    const colors = parseColorList(colorSpec, ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#fff']);
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;
      const size = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Static part: .x-fireworks__particle in effects.css. The random
      // per-particle values travel as a generated rule (#779).
      particle.className = 'x-fireworks__particle';
      setRule(particle, 'particle', {
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        left: `${centerX}px`,
        top: `${centerY}px`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        animationDuration: `${(burstMs * 2) / 3}ms`,
        '--end-x': `${Math.cos(angle) * velocity}px`,
        '--end-y': `${Math.sin(angle) * velocity}px`,
      });
      animContainer.appendChild(particle);
    }
    
    document.body.appendChild(animContainer);
    setTimeout(() => { clearRulesIn(animContainer); animContainer.remove(); }, burstMs);
  };

  element.onclick = fire;
  const { start: startRepeat, stop: stopRepeat } = repeatLoop(fire, config, 1500);
  if (config.repeat) startRepeat();
  element.wbFireworks = { fire, startRepeat, stopRepeat };
  return () => {
    stopRepeat();
    element.classList.remove('x-fireworks--trigger', 'x-fireworks--trigger-button');
  };
}

/**
 * Snow - Falling snowflakes
 */
export function snow(element, options = {}) {
  const count = parseInt(options.count || element.getAttribute('count') || '30');
  // show-button/repeat/delay/duration are declared in snow.schema.json and
  // were never read -- same contract as confetti (#655). `repeat` stays
  // opt-in here like the other two: turning it on by default would start
  // every existing <div x-snow> snowing unattended on page load.
  const config = {
    showButton: options.showButton ?? readFlag(element, 'show-button', true),
    repeat: options.repeat ?? readFlag(element, 'repeat'),
    delay: options.delay || element.getAttribute('delay') || '0s',
    duration: options.duration || element.getAttribute('duration') || '8s',
  };
  // Each flake falls for 3/8..7/8 of `duration` and starts up to 2s late --
  // the 3-7s spread the 8s default has always produced.
  const fallMs = toMs(config.duration) || 8000;
  element.classList.add('x-snow--trigger');
  // #448: no classList.add('x-snow') -- it just duplicated <div x-snow>'s own
  // tag name; no CSS selector depends on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-snow> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-snow> tag does not get a redundant class.
  element.classList.add('x-snow');

  // Make visible
  if (config.showButton && !element.textContent.trim()) {
    element.innerHTML = '❄️ <span>Let it Snow!</span>';
  }
  // Chrome: .x-snow--trigger-button in effects.css (#779).
  if (config.showButton) element.classList.add('x-snow--trigger-button');
  
  // Inject keyframes
  if (!document.getElementById('x-snow-styles')) {
    const style = document.createElement('style');
    style.id = 'x-snow-styles';
    style.textContent = `
      @keyframes x-snow-fall {
        0% { transform: translateY(0) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    // Fix: create container
    const container = document.createElement('div');
    container.className = 'x-snow-container';
    
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('span');
      const size = 10 + Math.random() * 20;
      const startX = Math.random() * 100;
      const duration = (fallMs / 1000) * (3 + Math.random() * 4) / 8;
      const delay = Math.random() * 2;

      flake.textContent = '❄️';
      // Static part: .x-snow__flake in effects.css; random values travel as
      // a generated rule (#779).
      flake.className = 'x-snow__flake';
      setRule(flake, 'flake', {
        fontSize: `${size / 16}rem`,
        left: `${startX}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      });
      container.appendChild(flake);
    }
    
    document.body.appendChild(container);
    setTimeout(() => { clearRulesIn(container); container.remove(); }, fallMs);
  };

  element.onclick = fire;
  const { start: startRepeat, stop: stopRepeat } = repeatLoop(fire, config, 8000);
  if (config.repeat) startRepeat();
  element.wbSnow = { fire, startRepeat, stopRepeat };
  return () => {
    stopRepeat();
    element.classList.remove('x-snow--trigger', 'x-snow--trigger-button');
  };
}

/**
 * Particle - Continuous floating particles
 */
export function particle(element, options = {}) {
  const count = parseInt(options.count || element.getAttribute('count') || '20');
  const color = options.color || element.getAttribute('color');
  element.classList.add('x-particle');
  // position/overflow and the dot colour default are .x-particle in
  // effects.css; only an author colour travels, as a generated rule (#779).
  if (color) setRule(element, 'color', { '--x-particle-color': color });
  
  // Inject keyframes
  if (!document.getElementById('x-particle-styles')) {
    const style = document.createElement('style');
    style.id = 'x-particle-styles';
    style.textContent = `
      @keyframes x-particle-float {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        50% { transform: translateY(-100px) translateX(20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const size = 2 + Math.random() * 4;
    const x = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    
    p.className = 'x-particle__dot';
    setRule(p, 'dot', {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}%`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    });
    element.appendChild(p);
    particles.push(p);
  }
  

  const releasePress = addPressFeedback(element);
  return () => {
    releasePress();
    particles.forEach(p => { clearRules(p); p.remove(); });
    clearRules(element);
    element.classList.remove('x-particle');
  };
}

// Export all
export default {
  animate, fadein, fadeout, slidein, slideout, zoomin, zoomout,
  flip, rotate, bounce, shake, pulse, flash, tada, wobble, jello,
  swing, rubberband, heartbeat, confetti, typewriter, countup,
  parallax, reveal, marquee, sparkle, glow, rainbow, fireworks, snow, particle
};