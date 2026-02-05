/**
 * Behaviors showcase page enhancements: navigation, scroll, code copy.
 * - Page initialization for the WB behaviors demo showcase.
 */
export function cc() {}

/**
 * Initialize the behaviors showcase page
 * @param {HTMLElement} element - Container element (usually body or main)
 * @param {Object} options - Configuration options
 */
export function behaviorsShowcase(element, options = {}) {
  element.classList.add('wb-behaviors-showcase');
  
  // Initialize features
  initNavHighlighting(element);
  initSmoothScroll(element);
  initCodeCopy(element);
  initDemoInteractions(element);
  
  // Mark as ready
  element.dataset.wbReady = 'true';
  
  console.log('✅ wb-starter Behaviors Showcase initialized');
}

/**
 * Highlight current section in navigation as user scrolls
 */
function initNavHighlighting(container) {
  const nav = container.querySelector('#nav, .showcase-nav');
  if (!nav) return;
  
  const sections = container.querySelectorAll('section[id]');
  const navLinks = nav.querySelectorAll('a[href^="#"]');
  
  if (sections.length === 0 || navLinks.length === 0) return;
  
  // Defensive IntersectionObserver: guard callback and observe calls so a
  // reference/implementation error cannot bubble (prevents "observer is not defined").
  let observer = null;
  try {
    observer = new IntersectionObserver((entries) => {
      try {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;

            navLinks.forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              }
            });
          }
        });
      } catch (cbErr) {
        console.debug('[wb-showcase] IntersectionObserver callback error:', cbErr);
      }
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -50% 0px'
    });
  } catch (instErr) {
    console.debug('[wb-showcase] IntersectionObserver unavailable:', instErr);
  }

  if (observer) {
    sections.forEach(section => {
      try { observer.observe(section); } catch (obsErr) { console.debug('[wb-showcase] observer.observe failed', obsErr); }
    });
  }
}

/**
 * Add smooth scrolling to anchor links
 */
function initSmoothScroll(container) {
  container.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Update URL without scrolling
      history.pushState(null, '', `#${targetId}`);
    }
  });
}

/**
 * Add copy functionality to code examples
 */
function initCodeCopy(container) {
  container.querySelectorAll('wb-mdhtml').forEach(mdhtml => {
    // Check if copy button already exists
    if (mdhtml.querySelector('.code-copy-btn')) return;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.textContent = '📋 Copy';
    copyBtn.title = 'Copy code to clipboard';
    
    copyBtn.addEventListener('click', async () => {
      const code = mdhtml.querySelector('pre code, code');
      if (code) {
        try {
          await navigator.clipboard.writeText(code.textContent);
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
          }, 2000);
        } catch (err) {
          copyBtn.textContent = '❌ Failed';
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
          }, 2000);
        }
      }
    });
    
    mdhtml.style.position = 'relative';
    mdhtml.appendChild(copyBtn);
  });
}

/**
 * Initialize demo interaction tracking
 */
function initDemoInteractions(container) {
  // Track button clicks for analytics/debugging
  container.querySelectorAll('.demo-area button, .demo-row button').forEach(btn => {
    btn.addEventListener('click', () => {
      const behaviorAttr = Array.from(btn.attributes)
        .find(attr => attr.name.startsWith('x-'));
      
      if (behaviorAttr) {
        console.log(`[Demo] ${behaviorAttr.name} triggered`);
      }
    });
  });
}

/**
 * Get all behaviors demonstrated on the page
 * @returns {Object} Object with customElements and xBehaviors arrays
 */
export function getBehaviorInventory() {
  const customElements = new Set();
  const xBehaviors = new Set();
  
  document.querySelectorAll('*').forEach(el => {
    // Custom elements (wb-*)
    if (el.tagName.toLowerCase().startsWith('wb-')) {
      customElements.add(el.tagName.toLowerCase());
    }
    
    // x-* behaviors
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('x-')) {
        xBehaviors.add(attr.name);
      }
    });
  });
  
  return {
    customElements: Array.from(customElements).sort(),
    xBehaviors: Array.from(xBehaviors).sort()
  };
}

/**
 * Scroll to a specific section by ID
 * @param {string} sectionId - The section ID to scroll to
 */
export function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Toggle code visibility for a demo
 * @param {HTMLElement} demoContainer - The demo container element
 */
export function toggleCode(demoContainer) {
  const codeBlock = demoContainer.querySelector('wb-mdhtml');
  if (codeBlock) {
    codeBlock.classList.toggle('collapsed');
  }
}

// CSS for copy button (injected once)
if (!document.getElementById('wb-showcase-styles')) {
  const style = document.createElement('style');
  style.id = 'wb-showcase-styles';
  style.textContent = `
    .code-copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      background: var(--bg-tertiary, #374151);
      color: var(--text-secondary, #9ca3af);
      border: 1px solid var(--border-color, #4b5563);
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }
    
    .code-copy-btn:hover {
      background: var(--primary, #6366f1);
      color: white;
      border-color: var(--primary, #6366f1);
    }
    
    .showcase-nav a.active {
      background: var(--primary, #6366f1);
      color: white;
      border-color: var(--primary, #6366f1);
    }
    
    wb-mdhtml.collapsed {
      display: none;
    }
  `;
  document.head.appendChild(style);
}
