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
 * Animate - General animation trigger
 * Helper Attribute: [x-animate]
 */
export declare function animate(element: any, options?: any): () => any;
/**
 * Fade In
 * Helper Attribute: [x-fadein]
 */
export declare function fadein(element: any): () => any;
/**
 * Fade Out
 * Helper Attribute: [x-fadeout]
 */
export declare function fadeout(element: any): () => any;
/**
 * Slide In
 * Helper Attribute: [x-slidein]
 */
export declare function slidein(element: any, options?: any): () => any;
export declare function slideout(element: any, options?: any): () => any;
export declare function zoomin(element: any): () => any;
export declare function zoomout(element: any): () => any;
export declare function flip(element: any): () => any;
export declare function rotate(element: any): () => any;
export declare function bounce(element: any): () => any;
export declare function shake(element: any): () => any;
export declare function pulse(element: any): () => any;
export declare function flash(element: any): () => any;
export declare function tada(element: any): () => any;
export declare function wobble(element: any): () => any;
export declare function jello(element: any): () => any;
export declare function swing(element: any): () => any;
export declare function rubberband(element: any): () => any;
export declare function heartbeat(element: any): () => any;
/**
 * Confetti - Explosion of colorful particles (VISIBLE BUTTON)
 * Helper Attribute: [x-confetti]
 */
export declare function confetti(element: any, options?: any): () => any;
/**
 * Typewriter - Types out text character by character
 * Helper Attribute: [x-typewriter]
 */
export declare function typewriter(element: any, options?: any): () => any;
/**
 * Countup - Animated number counter
 */
export declare function countup(element: any, options?: any): () => void;
/**
 * Parallax - Scroll-based movement
 */
export declare function parallax(element: any, options?: any): () => void;
/**
 * Reveal - Fade in when scrolled into view
 */
export declare function reveal(element: any, options?: any): () => void;
/**
 * Marquee - Scrolling text
 */
export declare function marquee(element: any, options?: any): () => any;
/**
 * Sparkle - Sparkle particles around element
 */
export declare function sparkle(element: any, options?: any): () => any;
/**
 * Glow - Pulsing glow effect
 */
export declare function glow(element: any, options?: any): () => any;
/**
 * Rainbow - Cycling rainbow text
 */
export declare function rainbow(element: any, options?: any): () => any;
/**
 * Fireworks - Burst of particles
 */
export declare function fireworks(element: any, options?: any): () => any;
/**
 * Snow - Falling snowflakes
 */
export declare function snow(element: any, options?: any): () => any;
/**
 * Particle - Continuous floating particles
 */
export declare function particle(element: any, options?: any): () => void;
declare const _default: {
    animate: typeof animate;
    fadein: typeof fadein;
    fadeout: typeof fadeout;
    slidein: typeof slidein;
    slideout: typeof slideout;
    zoomin: typeof zoomin;
    zoomout: typeof zoomout;
    flip: typeof flip;
    rotate: typeof rotate;
    bounce: typeof bounce;
    shake: typeof shake;
    pulse: typeof pulse;
    flash: typeof flash;
    tada: typeof tada;
    wobble: typeof wobble;
    jello: typeof jello;
    swing: typeof swing;
    rubberband: typeof rubberband;
    heartbeat: typeof heartbeat;
    confetti: typeof confetti;
    typewriter: typeof typewriter;
    countup: typeof countup;
    parallax: typeof parallax;
    reveal: typeof reveal;
    marquee: typeof marquee;
    sparkle: typeof sparkle;
    glow: typeof glow;
    rainbow: typeof rainbow;
    fireworks: typeof fireworks;
    snow: typeof snow;
    particle: typeof particle;
};
export default _default;
//# sourceMappingURL=effects.d.ts.map