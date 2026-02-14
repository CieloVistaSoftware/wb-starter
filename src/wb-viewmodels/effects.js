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
export function animate(element, options = {}) {
  const config = {
    animation: options.animation || element.dataset.animation || 'fadeIn',
    duration: options.duration || element.dataset.duration || '0.5s',
    delay: options.delay || element.dataset.delay || '0s',
    easing: options.easing || element.dataset.easing || 'ease',
    trigger: options.trigger || element.dataset.trigger || 'click',
    ...options
  };

  element.classList.add('wb-animate');
  
  const play = () => {
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = `wb-${config.animation} ${config.duration} ${config.easing}`;
  };

  // All buttons trigger on click
  if (element.tagName === 'BUTTON') {
    element.onclick = play;
  } else if (config.trigger === 'load') {
    play();
  } else if (config.trigger === 'click') {
    element.style.cursor = 'pointer';
    element.onclick = play;
  }

  element.wbAnimate = { play };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-animate');
}

// Helper for click-triggered animations
function clickAnim(element, animName, duration = '0.5s') {
  element.classList.add(`wb-${animName}`);
  const playAnimation = () => {
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = `wb-${animName} ${duration} ease`;
  };
  if (element.tagName === 'BUTTON') {
    element.onclick = playAnimation;
  } else {
    element.onclick = playAnimation;
  }
  element.wbAnim = { play: playAnimation };
  element.classList.add('wb-ready');
  return () => element.classList.remove(`wb-${animName}`);
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
  const dir = options.direction || element.dataset.direction || 'left';
  return clickAnim(element, `slide-in-${dir}`, '0.5s');
}
export function slideout(element, options = {}) {
  const dir = options.direction || element.dataset.direction || 'left';
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
 * Confetti - Explosion of colorful particles (VISIBLE BUTTON)
 * Helper Attribute: [x-confetti]
 */
export function confetti(element, options = {}) {
  const config = {
    count: parseInt(options.count || element.dataset.count || '50'),
    label: options.label || element.dataset.label || 'Fire Confetti!',
    ...options
  };
  
  element.classList.add('wb-confetti-trigger');
  element.classList.add('wb-confetti');
  
  // MAKE IT VISIBLE! Render as a button if empty
  if (!element.textContent.trim()) {
    element.innerHTML = `<span>🎉</span><span>${config.label}</span>`;
  }
  
  // Style it as an attractive button
  element.style.cssText = `
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
    background-size: 300% 300%;
    animation: wb-confetti-gradient 3s ease infinite;
    color: #fff;
    font-weight: bold;
    border-radius: 8px;
    font-size: 1rem;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    border: none;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  
  // Add hover effect
  element.onmouseenter = () => {
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
  };
  element.onmouseleave = () => {
    element.style.transform = 'scale(1)';
    element.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
  };
  
  // Inject CSS keyframes if not present
  if (!document.getElementById('wb-confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-confetti-styles';
    style.textContent = `
      @keyframes wb-confetti-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes wb-confetti-fall {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) translateX(var(--end-x, 0)) rotate(var(--rotation, 720deg)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    // Create container
    const container = document.createElement('div');
    container.className = 'wb-confetti-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    
    // Create particles
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'];
    for (let i = 0; i < config.count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startX = 50 + (Math.random() - 0.5) * 20;
      const endX = startX + (Math.random() - 0.5) * 100;
      const rotation = Math.random() * 720;
      const duration = 2 + Math.random() * 2;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${startX}%;
        top: -20px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: wb-confetti-fall ${duration}s ease-out forwards;
        --end-x: ${endX - startX}vw;
        --rotation: ${rotation}deg;
        animation-delay: ${Math.random() * 0.3}s;
      `;
      container.appendChild(particle);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 5000);
  };
  
  element.onclick = fire;
  element.wbConfetti = { fire };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-confetti-trigger');
}

/**
 * Typewriter - Types out text character by character
 * Helper Attribute: [x-typewriter]
 */
export function typewriter(element, options = {}) {
  const config = {
    text: options.text || element.dataset.text || element.textContent || 'Hello World!',
    speed: parseInt(options.speed || element.dataset.speed || '50'),
    cursor: options.cursor ?? element.dataset.cursor !== 'false',
  };
  
  element.classList.add('wb-typewriter');
  
  const type = () => {
    element.textContent = '';
    element.style.borderRight = config.cursor ? '2px solid var(--primary, #6366f1)' : 'none';
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
  
  if (element.tagName === 'BUTTON') {
    element.onclick = type;
  } else {
    type();
  }
  
  element.wbTypewriter = { type };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-typewriter');
}

/**
 * Countup - Animated number counter
 */
export function countup(element, options = {}) {
  const config = {
    start: parseFloat(options.start || element.dataset.from || '0'),
    end: parseFloat(options.end || element.dataset.to || element.textContent || '100'),
    duration: parseInt(options.duration || element.dataset.duration || '2000'),
    prefix: options.prefix || element.dataset.prefix || '',
    suffix: options.suffix || element.dataset.suffix || '',
    decimals: parseInt(options.decimals || element.dataset.decimals || '0'),
  };
  
  element.classList.add('wb-countup');
  
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
  element.classList.add('wb-ready');
  return () => { observer.disconnect(); element.classList.remove('wb-countup'); };
}

/**
 * Parallax - Scroll-based movement
 */
export function parallax(element, options = {}) {
  const speed = parseFloat(options.speed || element.dataset.speed || '0.5');
  element.classList.add('wb-parallax');
  
  let ticking = false;

  const updateFn = () => {
    const rect = element.getBoundingClientRect();
    const offset = (window.innerHeight - rect.top) * speed * 0.1;
    element.style.transform = `translateY(${offset}px)`;
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
    element.classList.remove('wb-parallax');
  };
}

/**
 * Reveal - Fade in when scrolled into view
 */
export function reveal(element, options = {}) {
  const config = {
    threshold: parseFloat(options.threshold || element.dataset.threshold || '0.1'),
    once: options.once ?? element.dataset.once !== 'false',
  };
  
  element.classList.add('wb-reveal');
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        if (config.once) observer.disconnect();
      }
    });
  }, { threshold: config.threshold });
  
  observer.observe(element);
  element.classList.add('wb-ready');
  return () => { observer.disconnect(); element.classList.remove('wb-reveal'); };
}

/**
 * Marquee - Scrolling text
 */
export function marquee(element, options = {}) {
  const speed = parseInt(options.speed || element.dataset.speed || '30');
  element.classList.add('wb-marquee');
  
  const content = element.innerHTML;
  element.innerHTML = '';
  element.style.cssText = 'overflow:hidden;white-space:nowrap;display:flex;';
  
  for (let i = 0; i < 2; i++) {
    const span = document.createElement('span');
    span.innerHTML = content + '&nbsp;&nbsp;&nbsp;';
    span.style.cssText = `display:inline-block;animation:wb-marquee ${speed}s linear infinite;padding-right:2rem;`;
    element.appendChild(span);
  }
  
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-marquee');
}

/**
 * Sparkle - Sparkle particles around element
 */
export function sparkle(element, options = {}) {
  const count = parseInt(options.count || element.dataset.count || '15');
  element.classList.add('wb-sparkle-trigger');
  element.classList.add('wb-sparkle');
  element.style.position = 'relative';
  element.style.overflow = 'visible';
  
  // Inject sparkle keyframes
  if (!document.getElementById('wb-sparkle-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-sparkle-styles';
    style.textContent = `
      @keyframes wb-sparkle {
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
          spark.style.cssText = `
            position:absolute;top:50%;left:50%;font-size:${size}px;pointer-events:none;
            animation:wb-sparkle ${duration}s ease-out forwards;
            --end-x:${Math.cos(angle) * distance}px;--end-y:${Math.sin(angle) * distance}px;
            z-index:1000;filter:drop-shadow(0 0 4px gold);
          `;
          element.appendChild(spark);
          setTimeout(() => spark.remove(), duration * 1000);
        }
      }, wave * 150);
    }
  };
  
  element.onclick = fire;
  element.wbSparkle = { fire };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-sparkle-trigger');
}

/**
 * Glow - Pulsing glow effect
 */
export function glow(element, options = {}) {
  const color = options.color || element.dataset.color || 'var(--primary, #6366f1)';
  element.classList.add('wb-glow');
  element.style.setProperty('--glow-color', color);
  element.style.animation = 'wb-glow 1.5s ease-in-out infinite';
  element.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`;
  
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-glow');
}

/**
 * Rainbow - Cycling rainbow text
 */
export function rainbow(element, options = {}) {
  const duration = options.duration || element.dataset.duration || '3s';
  element.classList.add('wb-rainbow');
  
  // Inject rainbow keyframes
  if (!document.getElementById('wb-rainbow-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-rainbow-styles';
    style.textContent = `
      @keyframes wb-rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  element.style.backgroundImage = 'linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)';
  element.style.backgroundSize = '400% 400%';
  element.style.backgroundClip = 'text';
  element.style.webkitBackgroundClip = 'text';
  element.style.color = 'transparent';
  element.style.animation = `wb-rainbow ${duration} linear infinite`;
  
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-rainbow');
}

/**
 * Fireworks - Burst of particles
 */
export function fireworks(element, options = {}) {
  const count = parseInt(options.count || element.dataset.count || '30');
  element.classList.add('wb-fireworks-trigger');
  element.classList.add('wb-fireworks');
  
  // Make visible
  if (!element.textContent.trim()) {
    element.innerHTML = '🎆 <span>Fireworks!</span>';
  }
  element.style.cssText = 'cursor:pointer;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;border-radius:8px;font-weight:bold;display:inline-flex;align-items:center;gap:0.5rem;';
  
  // Inject keyframes
  if (!document.getElementById('wb-firework-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-firework-styles';
    style.textContent = `
      @keyframes wb-firework-particle {
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
    animContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    
    const colors = ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#fff'];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;
      const size = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;background:${color};border-radius:50%;
        left:${centerX}px;top:${centerY}px;box-shadow:0 0 ${size * 2}px ${color};
        animation:wb-firework-particle 1s ease-out forwards;
        --end-x:${Math.cos(angle) * velocity}px;--end-y:${Math.sin(angle) * velocity}px;
      `;
      animContainer.appendChild(particle);
    }
    
    document.body.appendChild(animContainer);
    setTimeout(() => animContainer.remove(), 1500);
  };
  
  element.onclick = fire;
  element.wbFireworks = { fire };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-fireworks-trigger');
}

/**
 * Snow - Falling snowflakes
 */
export function snow(element, options = {}) {
  const count = parseInt(options.count || element.dataset.count || '30');
  element.classList.add('wb-snow-trigger');
  element.classList.add('wb-snow');
  
  // Make visible
  if (!element.textContent.trim()) {
    element.innerHTML = '❄️ <span>Let it Snow!</span>';
  }
  element.style.cssText = 'cursor:pointer;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#a8edea,#fed6e3);color:#333;border-radius:8px;font-weight:bold;display:inline-flex;align-items:center;gap:0.5rem;';
  
  // Inject keyframes
  if (!document.getElementById('wb-snow-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-snow-styles';
    style.textContent = `
      @keyframes wb-snow-fall {
        0% { transform: translateY(0) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  const fire = () => {
    // Fix: create container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('span');
      const size = 10 + Math.random() * 20;
      const startX = Math.random() * 100;
      const duration = 3 + Math.random() * 4;
      const delay = Math.random() * 2;
      
      flake.textContent = '❄️';
      flake.style.cssText = `
        position:absolute;font-size:${size}px;left:${startX}%;top:-30px;
        animation:wb-snow-fall ${duration}s linear ${delay}s forwards;opacity:0.8;
      `;
      container.appendChild(flake);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 8000);
  };
  
  element.onclick = fire;
  element.wbSnow = { fire };
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-snow-trigger');
}

/**
 * Particle - Continuous floating particles
 */
export function particle(element, options = {}) {
  const count = parseInt(options.count || element.dataset.count || '20');
  const color = options.color || element.dataset.color || 'var(--primary, #6366f1)';
  element.classList.add('wb-particle');
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  
  // Inject keyframes
  if (!document.getElementById('wb-particle-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-particle-styles';
    style.textContent = `
      @keyframes wb-particle-float {
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
    
    p.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;background:${color};border-radius:50%;
      left:${x}%;bottom:-10px;opacity:0.6;
      animation:wb-particle-float ${duration}s ease-in-out ${delay}s infinite;pointer-events:none;
    `;
    element.appendChild(p);
    particles.push(p);
  }
  
  element.classList.add('wb-ready');
  return () => {
    particles.forEach(p => p.remove());
    element.classList.remove('wb-particle');
  };
}

// Export all
export default {
  animate, fadein, fadeout, slidein, slideout, zoomin, zoomout,
  flip, rotate, bounce, shake, pulse, flash, tada, wobble, jello,
  swing, rubberband, heartbeat, confetti, typewriter, countup,
  parallax, reveal, marquee, sparkle, glow, rainbow, fireworks, snow, particle
};