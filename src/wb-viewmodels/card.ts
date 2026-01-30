/**
 * Card Behavior + Variants
 * -----------------------------------------------------------------------------
 * Comprehensive card system supporting various content types and layouts.
 * Handles extensive variants like heroes, profiles, pricing, and media cards.
 * 
 * Usage:
 *   <wb-card variant="glass" title="Title">Content</wb-card>
 *   <wb-cardhero variant="cosmic" title="Hero Title" ...></wb-cardhero>
 * -----------------------------------------------------------------------------
 * 
 * ARCHITECTURE:
 * - All card variants INHERIT from cardBase
 * - Variants CONTAIN specialized content (images, profiles, etc.)
 * - Changes to cardBase propagate to ALL variants automatically
 * 
 * INHERITANCE: cardimage IS-A card
 * CONTAINMENT: cardimage HAS-A image (figure element)
 * 
 * SEMANTIC STANDARD (MANDATORY):
 * - Container: <article> (preferred) or <section>
 * - Header content (title, subtitle): <header>
 * - Main content: <main>
 * - Footer content (actions, buttons): <footer>
 * 
 * ALL text elements are EDITABLE via double-click in the builder
 */

// Common card padding
const CARD_PADDING = '1rem';

// Helper to parse boolean values from options/dataset
const parseBoolean = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === '') return true; // Handle boolean attributes (e.g. data-clickable="")
  return val;
};

// Helper to get attribute from options, dataset, or direct attribute
// Supports: options.src, element.dataset.src (data-src), element.getAttribute('src')
const getAttr = (element, options, name) => {
  return options[name] || element.dataset[name] || element.getAttribute(name) || '';
};

// Semantic element validation
const PREFERRED_TAGS = ['ARTICLE', 'SECTION'];

// Common CSS Variables
const VAR_TEXT_PRIMARY = 'var(--text-primary,#f9fafb)';
const VAR_TEXT_SECONDARY = 'var(--text-secondary,#9ca3af)';
const VAR_BORDER_COLOR = 'var(--border-color,#374151)';
const VAR_BG_TERTIARY = 'var(--bg-tertiary,#1e293b)';
const VAR_BG_SECONDARY = 'var(--bg-secondary,#1f2937)';
const VAR_PRIMARY = 'var(--primary,#6366f1)';

// Common Component Styles
const STYLE_HEADER = `padding:1rem;border-bottom:1px solid ${VAR_BORDER_COLOR};background:${VAR_BG_TERTIARY};display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;`;
const STYLE_FOOTER = `padding:1rem;border-top:1px solid ${VAR_BORDER_COLOR};background:${VAR_BG_TERTIARY};font-size:0.875rem;color:${VAR_TEXT_SECONDARY};`;
const STYLE_MAIN = `padding:1rem;flex:1;color:${VAR_TEXT_PRIMARY};`;
const STYLE_TITLE = `margin:0;font-size:1.1rem;font-weight:600;color:${VAR_TEXT_PRIMARY};`;
const STYLE_SUBTITLE = `margin:0.25rem 0 0;font-size:0.875rem;color:${VAR_TEXT_SECONDARY};`;
const STYLE_BADGE = `display:inline-block;padding:0.25rem 0.75rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${VAR_PRIMARY};color:white;white-space:nowrap;`;


function validateSemanticContainer(element, behaviorName) {
  const tag = element.tagName;
  // MVVM: Allow standard containers OR any custom element (implied by hyphen)
  // We do not enforce specific tag names here, decoupling View from Logic.
  const isAllowed = ['ARTICLE', 'SECTION', 'DIV'].includes(tag) || tag.includes('-');
  
  if (!isAllowed) {
    console.error(`[WB:${behaviorName}] Invalid container tag <${tag.toLowerCase()}>. Use <article>, <section>, or a custom element.`);
    return false;
  }
  return true;
}

/**
 * Base Card
 * All variants inherit from this
 */
export function cardBase(element: HTMLElement, options: Record<string, any> = {}) {
  // v3.0: Check if schema builder already processed this element
  // When true, DOM structure is already built from $view - we only add interactivity
  const schemaProcessed = options.schemaProcessed || element.dataset.wbSchema;
  
  const config: Record<string, any> = {
    // Core options (spread last so explicit props above can still be overridden)
    ...options, // Spread first to allow overrides, but specific logic below takes precedence
    behavior: options.behavior || 'card',
    title: options.title || element.dataset.title || element.getAttribute('title') || '',
    pretitle: options.pretitle || element.dataset.pretitle || '',
    subtitle: options.subtitle || element.dataset.subtitle || element.getAttribute('subtitle') || '',
    content: options.content || element.dataset.content || element.getAttribute('content') || '',
    footer: options.footer || element.dataset.footer || '',
    variant: options.variant || element.dataset.variant || element.getAttribute('variant') || 'default',
    badge: options.badge || element.dataset.badge || element.getAttribute('badge') || '',
    background: options.background || element.dataset.background || element.getAttribute('background') || '',
    clickable: parseBoolean(options.clickable) ?? (element.dataset.clickable === 'true' || (element.hasAttribute('data-clickable') && element.dataset.clickable !== 'false') || element.hasAttribute('clickable')),
    hoverable: parseBoolean(options.hoverable) ?? (element.dataset.hoverable !== 'false'),
    elevated: parseBoolean(options.elevated) ?? (element.dataset.elevated === 'true' || (element.hasAttribute('data-elevated') && element.dataset.elevated !== 'false') || element.hasAttribute('elevated')),
    size: options.size || element.dataset.size || element.getAttribute('size') || 'auto',
    hoverText: options.hoverText || element.dataset.hoverText || '',
    onClick: options.onClick || element.dataset.onClick || '',
    dataContext: options.dataContext || element.dataset.dataContext || '{}',

    // CTA helpers
    cta: options.cta || element.dataset.cta || element.getAttribute('cta') || '',
    ctaHref: options.ctaHref || element.dataset.ctaHref || element.getAttribute('cta-href') || '',
    ctaSecondary: options.ctaSecondary || element.dataset.ctaSecondary || element.getAttribute('cta-secondary') || '',
    ctaSecondaryHref: options.ctaSecondaryHref || element.dataset.ctaSecondaryHref || element.getAttribute('cta-secondary-href') || '',

    // Media helpers
    tracks: options.tracks || element.dataset.tracks || element.getAttribute('tracks') || '',

    // v3.0: Skip structure building if schema already did it
    skipStructure: parseBoolean(options.skipStructure) ?? schemaProcessed ?? false,
    schemaProcessed: schemaProcessed,
  };

  // Structure holders
  let header = options.existingHeader || null;
  let main = options.existingMain || null;
  let footer = options.existingFooter || null;
  let clickHandler = null;

  // Validate semantic container
  validateSemanticContainer(element, config.behavior);

  // Apply base classes
  element.classList.add('wb-card');
  if (config.behavior !== 'card') {
    element.classList.add(`wb-card--${config.behavior.replace('card', '')}`);
  }
  
  // Apply hover text
  if (config.hoverText) {
    element.setAttribute('title', config.hoverText);
  }
  
  // Apply base styles
  const baseStyles: Partial<CSSStyleDeclaration> = {
    transition: 'all 0.2s ease',
    borderRadius: 'var(--radius-lg, 8px)',
    background: config.background || element.style.background || 'var(--bg-secondary, #1f2937)',
    border: '1px solid var(--border-color, #374151)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    contain: 'layout paint', // Performance optimization
    overflowWrap: 'anywhere', // Ensure text wraps
    wordBreak: 'break-word'   // Ensure text wraps
  };

  // Glass variant overrides
  if (config.variant === 'glass') {
    baseStyles.background = 'rgba(255, 255, 255, 0.05)';
    baseStyles.backdropFilter = 'blur(10px)';
    (baseStyles as any).webkitBackdropFilter = 'blur(10px)';
    baseStyles.border = '1px solid rgba(255, 255, 255, 0.1)';
  }

  // Rack variant overrides
  if (config.variant === 'rack') {
    baseStyles.background = '#0f172a'; // Dark slate
    baseStyles.border = '1px solid #334155';
    baseStyles.borderLeft = '12px solid #1e293b'; // Rack ears
    baseStyles.borderRight = '12px solid #1e293b';
    baseStyles.borderRadius = '2px';
    baseStyles.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';
    baseStyles.fontFamily = 'ui-monospace, monospace';
  }
  
  Object.assign(element.style, baseStyles);
  
  // Variant class
  if (config.variant !== 'default') {
    element.classList.add(`wb-card--${config.variant}`);
  }
  
  // Size class
  // Only add valid size classes (e.g., 'sm', 'md', 'lg')
  if (config.size && ['sm','md','lg','xl'].includes(config.size)) {
    element.classList.add(`wb-card--${config.size}`);
  }
  
  // Elevated - lighter background to appear raised
  if (config.elevated) {
    element.classList.add('wb-card--elevated');
    element.style.boxShadow = 'var(--shadow-elevated, 0 4px 12px rgba(0,0,0,0.15))';
    element.style.background = 'var(--bg-elevated, #334155)'; // LIGHTER than base
  }
  
  // Hoverable
  const hoverEnter = () => {
    element.style.transform = 'translateY(-2px)';
    element.style.boxShadow = 'var(--shadow-hover, 0 8px 24px rgba(0,0,0,0.2))';
    element.style.borderColor = 'var(--primary, #6366f1)';
  };
  const hoverLeave = () => {
    element.style.transform = '';
    element.style.boxShadow = config.elevated ? 'var(--shadow-elevated, 0 4px 12px rgba(0,0,0,0.15))' : '';
    element.style.borderColor = 'var(--border-color, #374151)';
  };
  
  if (config.hoverable) {
    element.classList.add('wb-card--hoverable');
    element.addEventListener('mouseenter', hoverEnter);
    element.addEventListener('mouseleave', hoverLeave);
  }
  
  if (config.clickable) {
    element.classList.add('wb-card--clickable');
    element.style.cursor = 'pointer';
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');

    clickHandler = () => {
      element.classList.toggle('wb-card--active');
    };
    element.addEventListener('click', clickHandler);
    
    // Also handle Enter/Space for accessibility
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clickHandler();
      }
    });
  }

  // LOGIC: Dynamic onClick handler (v3.1)
  if (config.onClick) {
    // Ensure element looks interactive
    element.style.cursor = 'pointer';
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');

    const runAction = (e) => {
      // Don't navigate if it's a hash link unless explicitly handled
      if (element.tagName === 'A' && element.getAttribute('href') === '#') {
        e.preventDefault();
      }

      try {
        // Parse local data context safely
        let data = {};
        try { 
          if (config.dataContext) data = JSON.parse(config.dataContext); 
        } catch(err) {
          console.warn('[WB:Logic] Invalid JSON in dataContext:', err);
        }

        // Execute script with context
        // Scope: this=element, e=event, config=config, data=localData
        const fn = new Function('e', 'config', 'data', 'element', config.onClick);
        fn.call(element, e, config, data, element);
      } catch (err) {
        console.error('[WB:Logic] Script error:', err);
        console.debug('Script Source:', config.onClick);
      }
    };

    element.addEventListener('click', runAction);
    
    // Accessibility support for enter/space
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        runAction(e);
      }
    });
  }

  element.dataset.wbReady = (element.dataset.wbReady || '') + ` ${config.behavior}`;

  // Return base context for variants to use
  return {
    element,
    config,
    header,
    main,
    footer,
    CARD_PADDING,
    
    // =========================================
    // UTILITY METHODS FOR BUILDING CARD PARTS
    // =========================================
    
    /**
     * Create a header section with title and optional subtitle
     * ALWAYS renders title/subtitle if provided in config
     */
    createHeader: (extraContent = '') => {
      const h = document.createElement('header');
      h.className = 'wb-card__header';
      h.style.cssText = STYLE_HEADER;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'wb-card__header-content';
      contentDiv.style.cssText = 'flex:1;min-width:0;';

      if (config.title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'wb-card__title';
        titleEl.style.cssText = STYLE_TITLE;
        titleEl.textContent = config.title;
        contentDiv.appendChild(titleEl);
      }
      
      if (config.subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'wb-card__subtitle';
        subtitleEl.style.cssText = STYLE_SUBTITLE;
        subtitleEl.textContent = config.subtitle;
        contentDiv.appendChild(subtitleEl);
      }
      
      if (extraContent) {
        const extra = document.createElement('div');
        extra.innerHTML = extraContent;
        contentDiv.appendChild(extra);
      }
      
      h.appendChild(contentDiv);

      if (config.badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'wb-card__badge';
        badgeEl.style.cssText = STYLE_BADGE;
        badgeEl.textContent = config.badge;
        h.appendChild(badgeEl);
      }

      return h;
    },
    
    /**
     * Create the main content area
     */
    createMain: (content = '') => {
      const m = document.createElement('main');
      m.className = 'wb-card__main';
      m.style.cssText = STYLE_MAIN;
      
      // Use config.content if no content passed
      const finalContent = content || config.content;
      if (finalContent) {
        if (typeof finalContent === 'string') {
          m.innerHTML = finalContent;
        }
      }
      return m;
    },
    
    /**
     * Create footer section
     */
    createFooter: (content = '') => {
      const footEl = document.createElement('footer');
      footEl.className = 'wb-card__footer';
      footEl.style.cssText = STYLE_FOOTER;
      
      const footerText = content || config.footer;
      if (footerText) {
        if (typeof footerText === 'string') {
          footEl.textContent = footerText;
        }
      }
      return footEl;
    },
    
    /**
     * Create a figure element for images/media
     */
    createFigure: () => {
      const fig = document.createElement('figure');
    
      fig.className = 'wb-card__figure';
      fig.style.cssText = 'margin:0;overflow:hidden;';
      
      return fig;
    },
    
    /**
     * Build the complete card structure
     * Call this from variants to get header + main + footer
     */
    buildStructure: (options: Record<string, any> = {}) => {
      const { 
        headerContent = '', 
        mainContent = '', 
        footerContent = '',
        showHeader = true,
        showMain = true,
        showFooter = true
      } = options;
      
      // MVVM: Do NOT wipe innerHTML. We enhance what's there.
      // element.innerHTML = '';
      
      // HEADER - Always show if title or subtitle exists
      if (showHeader && (config.title || config.subtitle || headerContent || config.badge)) {
        if (!header) {
          const headerEl = document.createElement('header');
          headerEl.className = 'wb-card__header';
          headerEl.style.cssText = STYLE_HEADER;
          
          const headerContentWrap = document.createElement('div');
          headerContentWrap.className = 'wb-card__header-content';
          headerContentWrap.style.cssText = 'flex:1;min-width:0;';

          if (config.title) {
            const titleElem = document.createElement('h3');
            titleElem.className = 'wb-card__title';
            titleElem.style.cssText = STYLE_TITLE;
            titleElem.textContent = config.title;
            headerContentWrap.appendChild(titleElem);
          }
          
          if (config.subtitle) {
            const subtitleElem = document.createElement('p');
            subtitleElem.className = 'wb-card__subtitle';
            subtitleElem.style.cssText = STYLE_SUBTITLE;
            subtitleElem.textContent = config.subtitle;
            headerContentWrap.appendChild(subtitleElem);
          }
          
          if (headerContent) {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'wb-card__header-extra';
            extraDiv.innerHTML = headerContent;
            headerContentWrap.appendChild(extraDiv);
          }

          headerEl.appendChild(headerContentWrap);

          if (config.badge) {
            const headerBadge = document.createElement('span');
            headerBadge.className = 'wb-card__badge';
            headerBadge.style.cssText = STYLE_BADGE;
            headerBadge.textContent = config.badge;
            headerEl.appendChild(headerBadge);
          }
          
          header = headerEl;
          if (element.firstChild) {
            element.insertBefore(headerEl, element.firstChild);
          } else {
            element.appendChild(headerEl);
          }
        } else {
          // Enhance existing header
          header.classList.add('wb-card__header');
          header.style.padding = header.style.padding || '1rem';
          header.style.borderBottom = header.style.borderBottom || '1px solid var(--border-color,#374151)';
          header.style.background = header.style.background || VAR_BG_TERTIARY;
          
          // Inject badge if missing
          if (config.badge && !header.querySelector('.wb-card__badge')) {
            const existingHeaderBadge = document.createElement('span');
            existingHeaderBadge.className = 'wb-card__badge';
            existingHeaderBadge.style.cssText = STYLE_BADGE;
            existingHeaderBadge.textContent = config.badge;
            header.appendChild(existingHeaderBadge);
          }
        }
      }
      
      // MAIN - Always show
      if (showMain) {
        if (!main) {
          const mainEl = document.createElement('main');
          mainEl.className = 'wb-card__main';
          mainEl.style.cssText = STYLE_MAIN;
          
          const mainText = mainContent || config.content;
          if (mainText) {
            mainEl.innerHTML = mainText;
          } else {
            // Placeholder for empty main
            mainEl.innerHTML = '<p class="wb-card__content" style="margin:0;color:var(--text-secondary,#9ca3af);font-style:italic;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>';
          }
          
          main = mainEl;
          if (footer) {
            element.insertBefore(mainEl, footer);
          } else {
            element.appendChild(mainEl);
          }
        } else {
          // Enhance existing main
          main.classList.add('wb-card__main');
          main.style.padding = main.style.padding || '1rem';
          main.style.flex = main.style.flex || '1';
          main.style.color = main.style.color || VAR_TEXT_PRIMARY;

          // If main is empty (e.g. created by SchemaBuilder with empty slot)
          // but we have config.content, inject it.
          if (!main.innerHTML.trim() && config.content) {
             main.innerHTML = config.content;
          }
        }
      }
      
      // FOOTER - Show if footer text exists
      if (showFooter && (config.footer || footerContent)) {
        if (!footer) {
          const footerEl = document.createElement('footer');
          footerEl.className = 'wb-card__footer';
          footerEl.style.cssText = STYLE_FOOTER;
          footerEl.textContent = footerContent || config.footer;
          
          footer = footerEl;
          element.appendChild(footerEl);
        } else {
          // Enhance existing footer
          footer.classList.add('wb-card__footer');
          footer.style.padding = footer.style.padding || '0.75rem 1rem';
          footer.style.borderTop = footer.style.borderTop || '1px solid var(--border-color,#374151)';
          footer.style.background = footer.style.background || VAR_BG_TERTIARY;
        }
      }
      
      return { header, main, footer };
    },
    
    // Cleanup function
    cleanup: () => {
      element.classList.remove('wb-card', `wb-card--${config.behavior.replace('card', '')}`,
        `wb-card--${config.variant}`, `wb-card--${config.size}`, 'wb-card--hoverable', 'wb-card--elevated', 
        'wb-card--clickable', 'wb-card--active');
      if (config.hoverable) {
        element.removeEventListener('mouseenter', hoverEnter);
        element.removeEventListener('mouseleave', hoverLeave);
      }
      if (clickHandler) {
        element.removeEventListener('click', clickHandler);
      }
    }
  };
}

/**
 * Card Component
 * Custom Tag: <wb-card>
 */
export function card(element: HTMLElement, options: Record<string, any> = {}) {
  // FIX: Un-wrap auto-generated main if it contains semantic elements
  // This happens because SchemaBuilder wraps ALL content in the 'main' part defined in schema
  const autoMain = element.querySelector(':scope > .wb-card__main');
  if (autoMain && (autoMain.querySelector('header') || autoMain.querySelector('main'))) {
    const fragment = document.createDocumentFragment();
    while (autoMain.firstChild) {
      fragment.appendChild(autoMain.firstChild);
    }
    autoMain.remove();
    element.appendChild(fragment);
  }

  // Check for existing semantic structure (direct children)
  const hasHeader = element.querySelector(':scope > header');
  const hasMain = element.querySelector(':scope > main');
  const hasFooter = element.querySelector(':scope > footer');
  
  // Determine if we are upgrading raw content
  const isSemantic = hasHeader || hasMain || hasFooter;
  const hasContent = options.content || element.dataset.content;
  
  // Capture content:
  // 1. If semantic structure exists, we don't capture innerHTML (it's already in the structure)
  // 2. If valid content option/data provided, use it
  // 3. Fallback to innerHTML (raw content mode)
  const initialContent = isSemantic ? '' : (hasContent || element.innerHTML);

  const base = cardBase(element, { 
    ...element.dataset, 
    ...options, 
    behavior: 'card',
    content: initialContent,
    existingHeader: hasHeader,
    existingMain: hasMain,
    existingFooter: hasFooter
  });

  // FIX: Clear existing HTML if we captured it from innerHTML (raw mode)
  // This prevents buildStructure() from duplicating it inside the new <main>
  if (!isSemantic && !hasContent && initialContent) {
    element.innerHTML = '';
  }
  
  // Build structure handles both creation and enhancement
  base.buildStructure();
  
  return base.cleanup;
}

/**
 * Card Image Component
 * Custom Tag: <card-image>
 */
export function cardimage(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    src: getAttr(element, options, 'src'),
    alt: getAttr(element, options, 'alt'),
    aspect: getAttr(element, options, 'aspect') || '16/9',
    position: getAttr(element, options, 'position') || 'top',
    fit: getAttr(element, options, 'fit') || 'cover',
    title: getAttr(element, options, 'title'),
    subtitle: getAttr(element, options, 'subtitle'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardimage' });
  element.classList.add('wb-card-image');
  element.innerHTML = '';

  // Build header/main/footer structure
  base.buildStructure();

  // Image at top
  if (config.src && config.position === 'top') {
    const figure = base.createFigure();
    figure.style.aspectRatio = config.aspect;
    const img = document.createElement('img');
    img.src = config.src;
    img.alt = config.alt;
    img.loading = 'lazy';
    img.style.cssText = `width:100%;height:100%;object-fit:${config.fit};display:block;`;
    figure.appendChild(img);
    element.insertBefore(figure, element.firstChild);
  }

  // Image at bottom
  if (config.src && config.position === 'bottom') {
    const figureBottom = base.createFigure();
    figureBottom.style.aspectRatio = config.aspect;
    const imgBottom = document.createElement('img');
    imgBottom.src = config.src;
    imgBottom.alt = config.alt;
    imgBottom.loading = 'lazy';
    imgBottom.style.cssText = `width:100%;height:100%;object-fit:${config.fit};display:block;`;
    figureBottom.appendChild(imgBottom);
    element.appendChild(figureBottom);
  }

  return base.cleanup;
}

/**
 * Card Video Component
 * Custom Tag: <card-video>
 */
export function cardvideo(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    src: getAttr(element, options, 'src'),
    poster: getAttr(element, options, 'poster'),
    title: getAttr(element, options, 'title'),
    subtitle: getAttr(element, options, 'subtitle'),
    autoplay: parseBoolean(options.autoplay) ?? (element.dataset.autoplay === 'true' || element.getAttribute('autoplay') === 'true' || (element.hasAttribute('data-autoplay') && element.dataset.autoplay !== 'false')),
    muted: parseBoolean(options.muted) ?? (element.dataset.muted === 'true' || element.getAttribute('muted') === 'true' || (element.hasAttribute('data-muted') && element.dataset.muted !== 'false')),
    loop: parseBoolean(options.loop) ?? (element.dataset.loop === 'true' || element.getAttribute('loop') === 'true' || (element.hasAttribute('data-loop') && element.dataset.loop !== 'false')),
    controls: parseBoolean(options.controls) ?? (element.dataset.controls !== 'false' && element.getAttribute('controls') !== 'false'),
    tracks: options.tracks || element.dataset.tracks || element.getAttribute('tracks') || '',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardvideo' });
  element.classList.add('wb-card-video');
  element.innerHTML = '';

  // Build header/main/footer
  base.buildStructure();

  // Video figure
  if (config.src) {
    const coverFigure = base.createFigure();
    const video = document.createElement('video');
    video.src = config.src;
    video.style.cssText = 'width:100%;display:block;';
    if (config.poster) video.poster = config.poster;
    if (config.autoplay) video.autoplay = true;
    if (config.muted) video.muted = true;
    if (config.loop) video.loop = true;
    if (config.controls) video.controls = true;
    video.playsInline = true;
    
    // Check for tracks/captions
    const hasTracks = element.querySelector('track') || config.tracks;
    if (!hasTracks) {
      element.dataset.needsCaptions = "For accessibility, consider adding captions";
      element.setAttribute('data-captions-missing', 'true');
      // Add accessibility warning
      const warning = document.createElement('div');
      warning.className = 'wb-card__video-warning';
      warning.style.cssText = 'display:none;'; // Hidden but present for tests/SR
      warning.textContent = 'Video missing captions';
      coverFigure.appendChild(warning);
    }

    coverFigure.appendChild(video);
    element.insertBefore(coverFigure, element.firstChild);
  }

  return base.cleanup;
}

/**
 * Card Button Component
 * Custom Tag: <card-button>
 */
export function cardbutton(element: HTMLElement, options: Record<string, any> = {}) {
  // Use all inherited fields from cardBase, only add/override cardbutton-specific fields
  const config = {
    ...element.dataset,
    ...options,
    primary: options.primary || element.dataset.primary || element.getAttribute('primary'),
    secondary: options.secondary || element.dataset.secondary || element.getAttribute('secondary'),
    primaryHref: options.primaryHref || element.dataset.primaryHref || element.getAttribute('primary-href'),
    secondaryHref: options.secondaryHref || element.dataset.secondaryHref || element.getAttribute('secondary-href'),
    behavior: 'cardbutton'
  };

  const base = cardBase(element, config);
  element.classList.add('wb-card-button');
  element.innerHTML = '';
  base.buildStructure();

  // Add button footer if needed
  if (config.primary || config.secondary) {
    const btnFooter = document.createElement('footer');
    btnFooter.className = 'wb-card__btn-footer';
    btnFooter.style.cssText = 'padding:1rem;display:flex;gap:0.5rem;border-top:1px solid var(--border-color,#374151);';
    if (config.secondary) {
      const secBtn = document.createElement(config.secondaryHref ? 'a' : 'button');
      secBtn.className = 'wb-card__btn wb-card__btn--secondary';
      secBtn.textContent = config.secondary;
      secBtn.style.cssText = 'flex:1;padding:0.625rem 1rem;border:1px solid var(--border-color,#4b5563);border-radius:6px;cursor:pointer;background:transparent;color:var(--text-primary,#f9fafb);text-align:center;text-decoration:none;font-size:0.875rem;';
      if (config.secondaryHref) secBtn.href = config.secondaryHref;
      btnFooter.appendChild(secBtn);
    }
    if (config.primary) {
      const priBtn = document.createElement(config.primaryHref ? 'a' : 'button');
      priBtn.className = 'wb-card__btn wb-card__btn--primary';
      priBtn.textContent = config.primary;
      priBtn.style.cssText = 'flex:1;padding:0.625rem 1rem;border:none;border-radius:6px;cursor:pointer;background:var(--primary,#6366f1);color:white;text-align:center;text-decoration:none;font-size:0.875rem;font-weight:500;';
      if (config.primaryHref) priBtn.href = config.primaryHref;
      btnFooter.appendChild(priBtn);
    }
    element.appendChild(btnFooter);
  }
  return base.cleanup;
}

/**
 * Card Hero Component
 * Custom Tag: <card-hero>
 */
export function cardhero(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    background: options.background || element.dataset.background || element.getAttribute('background'),
    overlay: parseBoolean(options.overlay) ?? (element.dataset.overlay !== 'false' && element.getAttribute('overlay') !== 'false'),
    xalign: options.xalign || element.dataset.xalign || element.getAttribute('xalign') || 'center',
    height: options.height || element.dataset.height || element.getAttribute('height') || '400px',
    cta: options.cta || element.dataset.cta || element.getAttribute('cta'),
    ctaHref: options.ctaHref || element.dataset.ctaHref || element.getAttribute('cta-href'),
    ctaSecondary: options.ctaSecondary || element.dataset.ctaSecondary || element.getAttribute('cta-secondary'),
    ctaSecondaryHref: options.ctaSecondaryHref || element.dataset.ctaSecondaryHref || element.getAttribute('cta-secondary-href'),
    pretitle: options.pretitle || element.dataset.pretitle || element.getAttribute('pretitle'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardhero', hoverable: false });
  element.classList.add('wb-hero');

  // CHECK FOR SLOTS/CHILDREN BEFORE CLEARING
  // ----------------------------------------
  // If the user provided content inside the tag, we want to preserve specific pieces
  // marked with slot="..." or data-slot="..." to avoid putting HTML in attributes.
  
  const slots: Record<string, HTMLElement> = {};
  ['pretitle', 'title', 'subtitle'].forEach(slotName => {
    // Check standard ShadowDOM-like slot syntax
    let slotEl = element.querySelector(`[slot="${slotName}"]`);
    // Fallback to data-slot
    if (!slotEl) slotEl = element.querySelector(`[data-slot="${slotName}"]`);
    
    if (slotEl) {
      slots[slotName] = slotEl.cloneNode(true) as HTMLElement;
      // Remove slot attribute for cleaner DOM in result
      (slots[slotName] as HTMLElement).removeAttribute('slot');
      (slots[slotName] as HTMLElement).removeAttribute('data-slot');
    }
  });

  element.innerHTML = '';
  element.style.minHeight = config.height;
  element.style.position = 'relative';
  element.style.justifyContent = 'center';
  element.style.alignItems = config.xalign === 'left' ? 'flex-start' : config.xalign === 'right' ? 'flex-end' : 'center';
  element.style.textAlign = config.xalign;
  element.classList.add(`wb-card--xalign-${config.xalign}`);
  
  if (config.background) {
    if (config.background.includes('gradient') || config.background.startsWith('var(')) {
      element.style.backgroundImage = config.background;
    } else {
      element.style.backgroundImage = `url(${config.background})`;
    }
  } else {
    element.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';

  // Overlay
  if (config.overlay) {
    const overlayEl = document.createElement('div');
    overlayEl.className = 'wb-card__overlay';
    overlayEl.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);';
    element.appendChild(overlayEl);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'wb-card__hero-content';
  content.style.cssText = 'position:relative;z-index:1;padding:2rem;color:white;';

  // 1. Pretitle (Slot or Attribute)
  if (slots.pretitle) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-card__hero-pretitle';
    wrapper.style.marginBottom = '1.5rem';
    // If it's a block element, append directly. If not, wrap.
    wrapper.appendChild(slots.pretitle);
    content.appendChild(wrapper);
  } else if (base.config.pretitle) {
    const preEl = document.createElement('div');
    preEl.className = 'wb-card__hero-pretitle';
    preEl.style.marginBottom = '1.5rem';
    preEl.innerHTML = base.config.pretitle;
    content.appendChild(preEl);
  }

  // 2. Title (Slot or Attribute)
  if (slots.title) {
     // Ensure classes are added to provided slot element if needed, or wrap it
     slots.title.classList.add('wb-card__title', 'wb-card__hero-title');
     if (!slots.title.style.fontSize) slots.title.style.fontSize = '2.5rem';
     if (!slots.title.style.marginBottom) slots.title.style.margin = '0';
     slots.title.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
     content.appendChild(slots.title);
  } else if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title wb-card__hero-title';
    titleEl.style.cssText = 'margin:0;font-size:2.5rem;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.3);';
    titleEl.innerHTML = base.config.title;
    content.appendChild(titleEl);
  }

  // 3. Subtitle (Slot or Attribute)
  if (slots.subtitle) {
    slots.subtitle.classList.add('wb-card__subtitle', 'wb-card__hero-subtitle');
    slots.subtitle.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
    content.appendChild(slots.subtitle);
  } else if (base.config.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'wb-card__subtitle wb-card__hero-subtitle';
    subtitleEl.style.cssText = 'margin:0.75rem 0 0;font-size:1.25rem;opacity:0.9;text-shadow:0 1px 2px rgba(0,0,0,0.3);';
    subtitleEl.innerHTML = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  if (base.config.cta || base.config.ctaSecondary) {
    const ctaGroup = document.createElement('div');
    ctaGroup.className = 'wb-card__cta-group';
    ctaGroup.style.cssText = 'margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;';
    if (config.xalign === 'left') ctaGroup.style.justifyContent = 'flex-start';
    if (config.xalign === 'right') ctaGroup.style.justifyContent = 'flex-end';

    if (base.config.cta) {
      const btn = document.createElement('a');
      btn.className = 'wb-btn wb-btn--primary wb-btn--lg';
      btn.href = base.config.ctaHref || '#';
      btn.textContent = base.config.cta;
      ctaGroup.appendChild(btn);
    }

    if (base.config.ctaSecondary) {
      const btn = document.createElement('a');
      btn.className = 'wb-btn wb-btn--outline-light wb-btn--lg';
      btn.href = base.config.ctaSecondaryHref || '#';
      btn.textContent = base.config.ctaSecondary;
      ctaGroup.appendChild(btn);
    }
    content.appendChild(ctaGroup);
  }

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Profile Component
 * Custom Tag: <card-profile>
 */
export function cardprofile(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    avatar: options.avatar || element.dataset.avatar || element.getAttribute('avatar'),
    name: options.name || element.dataset.name || element.getAttribute('name'),
    role: options.role || element.dataset.role || element.getAttribute('role'),
    bio: options.bio || element.dataset.bio || element.getAttribute('bio'),
    cover: options.cover || element.dataset.cover || element.getAttribute('cover'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardprofile' });
  element.innerHTML = '';

  // Cover
  if (config.cover) {
    const coverFig = base.createFigure();
    coverFig.className = 'wb-card__figure wb-card__cover';
    coverFig.style.cssText = `margin:0;height:100px;background-image:url(${config.cover});background-size:cover;background-position:center;`;
    element.appendChild(coverFig);
  }

  // Profile content
  const content = document.createElement('header');
  content.className = 'wb-card__profile-content';
  content.style.cssText = `text-align:center;padding:1rem;${config.cover ? 'margin-top:-40px;' : ''}`;

  if (config.avatar) {
    const avatarImg = document.createElement('img');
    avatarImg.className = 'wb-card__avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.name || 'Avatar';
    avatarImg.style.cssText = 'width:80px;height:80px;border-radius:50%;border:4px solid var(--bg-secondary,#1f2937);object-fit:cover;';
    content.appendChild(avatarImg);
  }

  if (config.name) {
    const nameEl = document.createElement('h3');
    nameEl.className = 'wb-card__title wb-card__name';
    nameEl.style.cssText = 'margin:0.75rem 0 0;font-size:1.25rem;color:var(--text-primary,#f9fafb);';
    nameEl.textContent = config.name;
    content.appendChild(nameEl);
  }

  if (config.role) {
    const roleEl = document.createElement('p');
    roleEl.className = 'wb-card__subtitle wb-card__role';
    roleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--primary,#6366f1);font-size:0.9rem;';
    roleEl.textContent = config.role;
    content.appendChild(roleEl);
  }

  if (config.bio) {
    const bioEl = document.createElement('p');
    bioEl.className = 'wb-card__bio';
    bioEl.style.cssText = 'margin:1rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.875rem;line-height:1.5;';
    bioEl.textContent = config.bio;
    content.appendChild(bioEl);
  }

  element.appendChild(content);

  // Footer from base config
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  return base.cleanup;
}

/**
 * Card Pricing Component
 * Custom Tag: <card-pricing>
 */
export function cardpricing(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    plan: options.plan || element.dataset.plan || element.getAttribute('plan') || 'Basic Plan',
    price: options.price || element.dataset.price || element.getAttribute('price') || '$0',
    period: options.period || element.dataset.period || element.getAttribute('period') || '/month',
    features: options.features || element.dataset.features?.split(',') || element.getAttribute('features')?.split(',') || ['Feature 1', 'Feature 2'],
    cta: options.cta || element.dataset.cta || element.getAttribute('cta') || 'Get Started',
    ctaHref: options.ctaHref || element.dataset.ctaHref || element.getAttribute('cta-href') || '#',
    featured: parseBoolean(options.featured) ?? (element.dataset.featured === 'true' || element.getAttribute('featured') === 'true' || (element.hasAttribute('data-featured') && element.dataset.featured !== 'false')),
    background: options.background || element.dataset.background || element.getAttribute('background'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardpricing' });
  element.classList.add('wb-pricing');
  element.innerHTML = '';
  element.style.textAlign = 'center';
  element.style.containerType = 'inline-size'; // Enable container queries for responsive text
  element.style.padding = '0'; // Reset padding as we use header/main

  if (config.featured) {
    element.style.border = '2px solid var(--primary, #6366f1)';
    element.style.transform = 'scale(1.05)';
  }

  // Apply background image if provided
  if (config.background) {
    element.style.backgroundImage = `url(${config.background})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
  }

  // Header with Plan Name
  const header = base.createHeader();
  header.innerHTML = ''; // Clear default
  header.style.textAlign = 'center';
  
  const planEl = document.createElement('h3');
  planEl.className = 'wb-card__title wb-card__plan';
  planEl.style.cssText = 'margin:0;font-size:1.25rem;color:var(--text-primary,#f9fafb);';
  planEl.textContent = config.plan;
  header.appendChild(planEl);
  element.appendChild(header);

  // Main content with Price and Features
  const main = base.createMain();
  main.style.textAlign = 'center';

  // Price
  const priceWrap = document.createElement('div');
  priceWrap.className = 'wb-card__price-wrap';
  priceWrap.style.cssText = 'margin:1rem 0;';

  const priceEl = document.createElement('span');
  priceEl.className = 'wb-card__amount';
  // Use container query units (cqi) to scale text relative to card width
  priceEl.style.cssText = 'font-size:clamp(1.5rem, 18cqi, 3rem);font-weight:700;color:var(--text-primary,#f9fafb);white-space:nowrap;';
  priceEl.textContent = config.price;
  priceWrap.appendChild(priceEl);

  const periodEl = document.createElement('span');
  periodEl.className = 'wb-card__period';
  periodEl.style.cssText = 'color:var(--text-secondary,#9ca3af);';
  periodEl.textContent = config.period;
  priceWrap.appendChild(periodEl);

  main.appendChild(priceWrap);

  // Features
  const featuresList = document.createElement('ul');
  featuresList.className = 'wb-card__features';
  featuresList.style.cssText = 'list-style:none;padding:0;margin:1.5rem 0;text-align:left;';

  config.features.forEach(f => {
    const li = document.createElement('li');
    li.className = 'wb-card__feature';
    li.style.cssText = 'padding:0.5rem 0;color:var(--text-primary,#f9fafb);border-bottom:1px solid var(--border-color,#374151);';
    li.innerHTML = `<span style="color:var(--success,#22c55e);margin-right:0.5rem;">✓</span> ${f.trim()}`;
    featuresList.appendChild(li);
  });

  main.appendChild(featuresList);
  element.appendChild(main);

  // Footer with CTA
  const footer = base.createFooter();
  footer.innerHTML = ''; // Clear default
  footer.style.background = 'transparent';
  footer.style.borderTop = 'none';
  
  const ctaBtn = document.createElement('a');
  ctaBtn.href = config.ctaHref;
  ctaBtn.className = 'wb-card__cta';
  ctaBtn.style.cssText = 'display:block;padding:0.875rem;background:var(--primary,#6366f1);color:white;text-decoration:none;border-radius:8px;font-weight:600;transition:all 0.2s;text-align:center;';
  ctaBtn.textContent = config.cta;
  footer.appendChild(ctaBtn);
  
  element.appendChild(footer);

  return base.cleanup;
}

/**
 * Card Stats Component
 * Custom Tag: <card-stats>
 */
export function cardstats(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    value: options.value || element.dataset.value || element.getAttribute('value'),
    label: options.label || element.dataset.label || element.getAttribute('label'),
    icon: options.icon || element.dataset.icon || element.getAttribute('icon'),
    trend: options.trend || element.dataset.trend || element.getAttribute('trend'),
    trendValue: options.trendValue || element.dataset.trendValue || element.getAttribute('data-trend-value'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardstats', hoverable: false });
  element.classList.add('wb-stats');
  element.innerHTML = '';
  element.style.containerType = 'inline-size';
  element.style.padding = 'var(--space-md, 1rem)';
  element.style.flexDirection = 'row';
  element.style.alignItems = 'center';
  element.style.gap = 'var(--space-md, 1rem)';

  // Semantic: Icon belongs in header
  if (config.icon) {
    const header = document.createElement('header');
    header.style.cssText = 'padding:0;border:none;background:transparent;margin:0;';
    
    const iconEl = document.createElement('span');
    iconEl.className = 'wb-card__icon';
    iconEl.style.cssText = 'font-size:2rem;line-height:1;display:block;';
    iconEl.textContent = config.icon;
    
    header.appendChild(iconEl);
    element.appendChild(header);
  }

  // Semantic: Main content
  const content = document.createElement('main');
  content.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0;';

  if (config.value) {
    const valueEl = document.createElement('data');
    valueEl.value = config.value.replace(/[^0-9.-]/g, '') || config.value;
    valueEl.className = 'wb-card__stats-value';
    valueEl.style.cssText = 'font-size:clamp(1.25rem, 15cqi, 1.75rem);font-weight:700;color:var(--text-primary,#f9fafb);line-height:1.2;display:block;white-space:nowrap;';
    valueEl.textContent = config.value;
    content.appendChild(valueEl);
  }

  if (config.label) {
    const labelEl = document.createElement('p');
    labelEl.className = 'wb-card__stats-label';
    labelEl.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.875rem;margin:0.25rem 0 0 0;';
    labelEl.textContent = config.label;
    content.appendChild(labelEl);
  }

  if (config.trend && config.trendValue) {
    const trendEl = document.createElement('p');
    trendEl.className = 'wb-card__stats-trend';
    const trendColor = config.trend === 'up' ? 'var(--success, #22c55e)' : config.trend === 'down' ? 'var(--error, #ef4444)' : 'var(--text-secondary, #6b7280)';
    const trendIcon = config.trend === 'up' ? '↑' : config.trend === 'down' ? '↓' : '→';
    trendEl.style.cssText = `color:${trendColor};font-size:0.8rem;margin:0.25rem 0 0 0;font-weight:500;`;
    trendEl.textContent = `${trendIcon} ${config.trendValue}`;
    content.appendChild(trendEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Testimonial Component
 * Custom Tag: <card-testimonial>
 */
export function cardtestimonial(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    quote: options.quote || element.dataset.quote || element.getAttribute('quote') || element.textContent,
    author: options.author || element.dataset.author || element.getAttribute('author'),
    role: options.role || element.dataset.role || element.getAttribute('role'),
    avatar: options.avatar || element.dataset.avatar || element.getAttribute('avatar'),
    rating: options.rating || element.dataset.rating || element.getAttribute('rating'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardtestimonial', hoverable: false });
  element.classList.add('wb-testimonial');
  element.innerHTML = '';
  element.style.padding = CARD_PADDING;

  // Quote icon
  const quoteIcon = document.createElement('div');
  quoteIcon.style.cssText = 'font-size:3rem;line-height:1;color:var(--primary,#6366f1);opacity:0.3;';
  quoteIcon.textContent = '"';
  element.appendChild(quoteIcon);

  // Quote
  if (config.quote) {
    const quoteEl = document.createElement('blockquote');
    quoteEl.className = 'wb-card__quote';
    quoteEl.style.cssText = 'margin:0.5rem 0 1rem;font-size:1rem;line-height:1.6;color:var(--text-primary,#f9fafb);font-style:italic;';
    quoteEl.textContent = config.quote;
    element.appendChild(quoteEl);
  }

  // Rating
  if (config.rating) {
    const ratingEl = document.createElement('div');
    ratingEl.className = 'wb-card__rating';
    ratingEl.style.cssText = 'color:#f59e0b;margin-bottom:1rem;';
    ratingEl.textContent = '★'.repeat(parseInt(config.rating)) + '☆'.repeat(5 - parseInt(config.rating));
    element.appendChild(ratingEl);
  }

  // Author
  const authorWrap = document.createElement('footer');
  authorWrap.className = 'wb-card__footer';
  authorWrap.style.cssText = 'display:flex;align-items:center;gap:0.75rem;background:transparent;border:none;padding:0;';

  if (config.avatar) {
    const avatarImg = document.createElement('img');
    avatarImg.className = 'wb-card__avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.author || '';
    avatarImg.style.cssText = 'width:48px;height:48px;border-radius:50%;object-fit:cover;';
    authorWrap.appendChild(avatarImg);
  }

  const authorInfo = document.createElement('div');
  if (config.author) {
    const authorName = document.createElement('cite');
    authorName.className = 'wb-card__author';
    authorName.style.cssText = 'font-style:normal;font-weight:600;color:var(--text-primary,#f9fafb);display:block;';
    authorName.textContent = config.author;
    authorInfo.appendChild(authorName);
  }

  if (config.role) {
    const roleEl = document.createElement('span');
    roleEl.className = 'wb-card__author-role';
    roleEl.style.cssText = 'font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    roleEl.textContent = config.role;
    authorInfo.appendChild(roleEl);
  }

  authorWrap.appendChild(authorInfo);
  element.appendChild(authorWrap);

  return base.cleanup;
}

/**
 * Card Product Component
 * Custom Tag: <card-product>
 */
export function cardproduct(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    image: options.image || element.dataset.image || element.getAttribute('image'),
    price: options.price || element.dataset.price || element.getAttribute('price'),
    originalPrice: options.originalPrice || element.dataset.originalPrice || element.getAttribute('data-original-price'), // Special case
    badge: options.badge || element.dataset.badge || element.getAttribute('badge'),
    rating: options.rating || element.dataset.rating || element.getAttribute('rating'),
    reviews: options.reviews || element.dataset.reviews || element.getAttribute('reviews'),
    cta: options.cta || element.dataset.cta || element.getAttribute('cta') || 'Add to Cart',
    description: options.description || element.dataset.description || element.getAttribute('description'),
    subtitle: options.subtitle || element.dataset.subtitle || element.getAttribute('subtitle') || '',
    ...options
  };

  // Map description to subtitle if subtitle is missing, so cardBase picks it up
  if (config.description && !config.subtitle) {
    config.subtitle = config.description;
  }

  const base = cardBase(element, { ...config, behavior: 'cardproduct' });
  element.classList.add('wb-product');
  element.innerHTML = '';

  // Product image
  if (config.image) {
    const figure = base.createFigure();
    figure.style.position = 'relative';
    
    const img = document.createElement('img');
    img.src = config.image;
    img.alt = base.config.title || 'Product';
    img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;display:block;';
    figure.appendChild(img);


    // Removed duplicate badgeEl declaration


    element.appendChild(figure);
  }

  // Product info
  const info = document.createElement('div');
  info.className = 'wb-card__product-info';
  info.style.cssText = 'padding:1rem;';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title wb-card__product-title';
    titleEl.style.cssText = 'margin:0;font-size:1rem;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    info.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const descEl = document.createElement('p');
    descEl.className = 'wb-card__subtitle wb-card__product-desc';
    descEl.style.cssText = 'margin:0.25rem 0 0;font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    descEl.textContent = base.config.subtitle;
    info.appendChild(descEl);
  }

  // Rating
  if (config.rating) {
    const ratingWrap = document.createElement('div');
    ratingWrap.className = 'wb-card__product-rating';
    ratingWrap.style.cssText = 'margin:0.5rem 0;display:flex;align-items:center;gap:0.5rem;';
    
    const stars = document.createElement('span');
    stars.style.color = '#f59e0b';
    stars.textContent = '★'.repeat(Math.floor(parseFloat(config.rating)));
    ratingWrap.appendChild(stars);

    const ratingText = document.createElement('span');
    ratingText.style.cssText = 'font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    ratingText.textContent = config.rating + (config.reviews ? ` (${config.reviews})` : '');
    ratingWrap.appendChild(ratingText);

    info.appendChild(ratingWrap);
  }

  // Price
  const priceWrap = document.createElement('div');
  priceWrap.className = 'wb-card__price-wrap';
  priceWrap.style.cssText = 'margin:0.75rem 0;display:flex;align-items:center;gap:0.5rem;';

  if (config.price) {
    const priceEl = document.createElement('span');
    priceEl.className = 'wb-card__price-current';
    priceEl.style.cssText = 'font-size:1.25rem;font-weight:700;color:var(--text-primary,#f9fafb);';
    priceEl.textContent = config.price;
    priceWrap.appendChild(priceEl);
  }

  if (config.originalPrice) {
    const origEl = document.createElement('span');
    origEl.className = 'wb-card__price-original';
    origEl.style.cssText = 'text-decoration:line-through;color:var(--text-secondary,#6b7280);font-size:0.9rem;';
    origEl.textContent = config.originalPrice;
    priceWrap.appendChild(origEl);
  }

  info.appendChild(priceWrap);

  // CTA button
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'wb-card__product-cta';
  ctaBtn.style.cssText = 'width:100%;padding:0.75rem;background:var(--primary,#6366f1);color:white;border:none;border-radius:6px;font-weight:500;cursor:pointer;';
  ctaBtn.textContent = config.cta;
  
  // Dispatch event on click
  ctaBtn.onclick = (e) => {
    e.stopPropagation();
    element.dispatchEvent(new CustomEvent('wb:cardproduct:addtocart', {
      bubbles: true,
      detail: {
        title: base.config.title,
        price: config.price,
        id: element.id
      }
    }));
  };

  info.appendChild(ctaBtn);

  element.appendChild(info);

  return base.cleanup;
}

/**
 * Card Notification Component
 * Custom Tag: <card-notification>
 */
export function cardnotification(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    type: options.type || element.dataset.type || element.getAttribute('type') || 'info',
    message: options.message || element.dataset.message || element.getAttribute('message') || element.textContent,
    dismissible: parseBoolean(options.dismissible) ?? (element.dataset.dismissible !== 'false' && element.getAttribute('dismissible') !== 'false'),
    icon: options.icon || element.dataset.icon || element.getAttribute('icon'),
    ...options
  };

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', primary: '🔵', secondary: '⚪' };
  const colors = { 
    info: 'var(--info, #3b82f6)', 
    success: 'var(--success, #22c55e)', 
    warning: 'var(--warning, #f59e0b)', 
    error: 'var(--error, #ef4444)',
    primary: 'var(--primary, #6366f1)',
    secondary: 'var(--text-secondary, #6b7280)'
  };
  // Use CSS variables for backgrounds if possible, or fallback to rgba
  const bgColors = { 
    info: 'var(--bg-info-subtle, rgba(59,130,246,0.15))', 
    success: 'var(--bg-success-subtle, rgba(34,197,94,0.15))', 
    warning: 'var(--bg-warning-subtle, rgba(245,158,11,0.15))', 
    error: 'var(--bg-error-subtle, rgba(239,68,68,0.15))',
    primary: 'var(--bg-primary-subtle, rgba(99,102,241,0.15))',
    secondary: 'var(--bg-secondary-subtle, rgba(107,114,128,0.15))'
  };

  const base = cardBase(element, { ...config, behavior: 'cardnotification', hoverable: false });
  element.classList.add('wb-notification');
  
  element.innerHTML = '';
  element.setAttribute('role', 'alert');
  element.style.padding = '0.875rem 1rem';
  element.style.flexDirection = 'row';
  element.style.alignItems = 'flex-start';
  element.style.gap = '0.75rem';
  element.style.borderLeft = `4px solid ${colors[config.type]}`;
  element.style.background = bgColors[config.type];

  // Icon
  const iconEl = document.createElement('span');
  iconEl.className = 'wb-card__notification-icon';
  iconEl.style.cssText = 'font-size:1.25rem;flex-shrink:0;';
  iconEl.textContent = config.icon || icons[config.type];
  element.appendChild(iconEl);

  // Content
  const content = document.createElement('main');
  content.className = 'wb-card__notification-content';
  content.style.cssText = 'flex:1;min-width:0;';

  if (base.config.title) {
    const titleEl = document.createElement('strong');
    titleEl.className = 'wb-card__notification-title';
    titleEl.style.cssText = 'display:block;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (config.message) {
    const msgEl = document.createElement('p');
    msgEl.className = 'wb-card__notification-message';
    msgEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-primary,#f9fafb);opacity:0.9;';
    msgEl.textContent = config.message;
    content.appendChild(msgEl);
  }

  element.appendChild(content);

  // Dismiss button
  if (config.dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wb-card__notification-dismiss';
    closeBtn.style.cssText = 'background:none;border:none;font-size:1.25rem;cursor:pointer;opacity:0.5;padding:0;color:var(--text-primary,#f9fafb);';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    
    const dismiss = () => {
      element.remove();
      element.dispatchEvent(new CustomEvent('wb:cardnotification:dismiss', {
        bubbles: true,
        detail: { 
          type: config.type,
          title: base.config.title
        }
      }));
    };

    closeBtn.onclick = dismiss;
    element.appendChild(closeBtn);
    
    // Keyboard support (Escape)
    element.setAttribute('tabindex', '0'); // Make focusable to catch key events
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    });
  }

  return base.cleanup;
}

/**
 * Card File Component
 * Custom Tag: <card-file>
 */
export function cardfile(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    filename: options.filename || element.dataset.filename || element.getAttribute('filename'),
    type: options.type || element.dataset.type || element.getAttribute('type') || 'file',
    size: options.size || element.dataset.size || element.getAttribute('size'),
    date: options.date || element.dataset.date || element.getAttribute('date'),
    downloadable: parseBoolean(options.downloadable) ?? (element.dataset.downloadable !== 'false' && element.getAttribute('downloadable') !== 'false'),
    href: options.href || element.dataset.href || element.getAttribute('href'),
    ...options
  };

  const icons = { pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', audio: '🎵', zip: '📦', file: '📁' };

  const base = cardBase(element, { ...config, behavior: 'cardfile', hoverable: false });
  element.classList.add('wb-card-file');
  element.innerHTML = '';
  element.style.padding = CARD_PADDING;
  element.style.flexDirection = 'row';
  element.style.alignItems = 'center';
  element.style.gap = '1rem';

  // Icon
  const iconEl = document.createElement('span');
  iconEl.style.cssText = 'font-size:2.5rem;';
  iconEl.textContent = icons[config.type] || icons.file;
  element.appendChild(iconEl);

  // Info
  const info = document.createElement('div');
  info.style.cssText = 'flex:1;min-width:0;';

  if (config.filename) {
    const nameEl = document.createElement('h3');
    nameEl.className = 'wb-card__filename';
    nameEl.style.cssText = 'margin:0;font-size:1rem;color:var(--text-primary,#f9fafb);white-space:normal;word-break:break-word;';
    nameEl.textContent = config.filename;
    info.appendChild(nameEl);
  }

  const meta = [];
  if (config.size) meta.push(config.size);
  if (config.date) meta.push(config.date);

  if (meta.length) {
    const metaEl = document.createElement('p');
    metaEl.className = 'wb-card__file-meta';
    metaEl.style.cssText = 'margin:0.25rem 0 0;font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    metaEl.textContent = meta.join(' • ');
    info.appendChild(metaEl);
  }

  element.appendChild(info);

  // Download
  if (config.downloadable && config.href) {
    const downloadBtn = document.createElement('a');
    downloadBtn.href = config.href;
    downloadBtn.download = config.filename || '';
    downloadBtn.style.cssText = 'font-size:1.5rem;text-decoration:none;';
    downloadBtn.textContent = '⬇️';
    element.appendChild(downloadBtn);
  }

  return base.cleanup;
}

/**
 * Card Link Component
 * Custom Tag: <card-link>
 */
export function cardlink(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    href: options.href || element.dataset.href || element.getAttribute('href') || '#',
    target: options.target || element.dataset.target || element.getAttribute('target') || '_self',
    icon: options.icon || element.dataset.icon || element.getAttribute('icon'),
    description: options.description || element.dataset.description || element.getAttribute('description') || '',
    badge: options.badge || element.dataset.badge || element.getAttribute('badge') || '',
    badgeVariant: options.badgeVariant || element.dataset.badgeVariant || element.getAttribute('badge-variant') || 'glass', // glass, gradient
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardlink' });
  element.classList.add('wb-card-link');
  
  element.innerHTML = '';
  element.style.cursor = 'pointer';
  element.style.position = 'relative';
  element.style.padding = '1.25rem';
  element.setAttribute('role', 'link');
  element.setAttribute('tabindex', '0');

  // Header row with icon and external indicator
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;';

  const titleGroup = document.createElement('div');
  titleGroup.style.cssText = 'flex:1;';

  // Icon + Title row
  if (config.icon || base.config.title) {
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
    
    if (config.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'wb-card__icon';
      iconEl.style.cssText = 'font-size:1.25rem;line-height:1;';
      iconEl.textContent = config.icon;
      titleRow.appendChild(iconEl);
    }
    
    if (base.config.title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'wb-card__title';
      titleEl.style.cssText = STYLE_TITLE;
      titleEl.textContent = base.config.title;
      titleRow.appendChild(titleEl);
    }
    
    titleGroup.appendChild(titleRow);
  }

  // Description (subtitle or description)
  const desc = config.description || base.config.subtitle;
  if (desc) {
    const descEl = document.createElement('p');
    descEl.className = 'wb-card__description';
    descEl.style.cssText = 'margin:0.5rem 0 0;font-size:0.875rem;color:var(--text-secondary,#9ca3af);line-height:1.5;';
    descEl.textContent = desc;
    titleGroup.appendChild(descEl);
  }

  // Badge
  if (config.badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = config.badgeVariant === 'gradient' ? 'wb-badge-gradient' : 'wb-tag-glass';
    badgeEl.style.cssText = 'margin-top:0.75rem;display:inline-block;';
    badgeEl.textContent = config.badge;
    titleGroup.appendChild(badgeEl);
  }

  headerRow.appendChild(titleGroup);

  // External indicator
  if (config.target === '_blank') {
    const extIcon = document.createElement('span');
    extIcon.style.cssText = 'opacity:0.5;font-size:1rem;flex-shrink:0;';
    extIcon.textContent = '↗';
    headerRow.appendChild(extIcon);
  }

  element.appendChild(headerRow);

  // Click handler
  const clickHandler = (e) => {
    e.preventDefault();
    if (config.href && config.href !== '#') {
      window.open(config.href, config.target);
    }
  };

  element.addEventListener('click', clickHandler);
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clickHandler(e);
    }
  });

  return () => {
    base.cleanup();
    element.removeEventListener('click', clickHandler);
  };
}

/**
 * Card Horizontal Component
 * Custom Tag: <card-horizontal>
 */
export function cardhorizontal(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    image: options.image || element.dataset.image || element.getAttribute('image'),
    imagePosition: options.imagePosition || element.dataset.imagePosition || element.getAttribute('image-position') || 'left',
    imageWidth: options.imageWidth || element.dataset.imageWidth || element.getAttribute('image-width') || '40%',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardhorizontal' });
  element.classList.add('wb-card-horizontal');
  element.innerHTML = '';
  element.style.flexDirection = config.imagePosition === 'right' ? 'row-reverse' : 'row';

  // Image
  if (config.image) {
    const figure = base.createFigure();
    figure.style.width = config.imageWidth;
    figure.style.flexShrink = '0';
    
    const img = document.createElement('img');
    img.src = config.image;
    img.alt = base.config.title || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    figure.appendChild(img);
    element.appendChild(figure);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'wb-card__horizontal-content';
  content.style.cssText = 'flex:1;padding:1rem;display:flex;flex-direction:column;justify-content:center;';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title';
    titleEl.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'wb-card__subtitle';
    subtitleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-secondary,#9ca3af);';
    subtitleEl.textContent = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  if (base.config.content) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'wb-card__horiz-body';
    bodyEl.style.cssText = 'margin-top:0.75rem;color:var(--text-primary,#f9fafb);';
    bodyEl.innerHTML = base.config.content;
    content.appendChild(bodyEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Overlay Component
 * Custom Tag: <card-overlay>
 */
export function cardoverlay(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    image: options.image || element.dataset.image || element.getAttribute('image'),
    position: options.position || element.dataset.position || element.getAttribute('position') || 'bottom',
    gradient: parseBoolean(options.gradient) ?? (element.dataset.gradient !== 'false' && element.getAttribute('gradient') !== 'false'),
    height: options.height || element.dataset.height || element.getAttribute('height') || '300px',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardoverlay', hoverable: false });
  element.classList.add('wb-card-overlay');
  element.classList.add('wb-card--overlay-card');
  element.classList.add(`wb-card--overlay-${config.position}`);
  element.innerHTML = '';
  
  element.style.height = config.height;
  element.style.position = 'relative';
  element.style.backgroundImage = config.image ? `url(${config.image})` : 'linear-gradient(135deg, #667eea, #764ba2)';
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  
  // Use row direction so align-items controls vertical position (as expected by tests)
  element.style.flexDirection = 'row';
  
  if (config.position === 'top') {
    element.style.alignItems = 'flex-start';
  } else if (config.position === 'center') {
    element.style.alignItems = 'center';
  } else {
    element.style.alignItems = 'flex-end';
  }

  // Content
  const content = document.createElement('div');
  content.className = 'wb-card__overlay-content';
  content.style.cssText = 'padding:1.5rem;color:white;width:100%;';

  if (config.gradient) {
    content.style.background = config.position === 'top' 
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      : 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)';
  }

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title wb-card__overlay-title';
    titleEl.style.cssText = 'margin:0;font-size:1.5rem;text-shadow:0 2px 4px rgba(0,0,0,0.5);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'wb-card__subtitle wb-card__overlay-subtitle';
    subtitleEl.style.cssText = 'margin:0.5rem 0 0;opacity:0.9;text-shadow:0 1px 2px rgba(0,0,0,0.5);';
    subtitleEl.textContent = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Expandable Component
 * Custom Tag: <card-expandable>
 */
export function cardexpandable(element: HTMLElement, options: Record<string, any> = {}) {
  // Capture existing content as fallback before clearing
  const rawContent = element.innerHTML.trim();

  const config = {
    expanded: parseBoolean(options.expanded) ?? (element.dataset.expanded === 'true' || element.getAttribute('expanded') === 'true' || (element.hasAttribute('data-expanded') && element.dataset.expanded !== 'false')),
    maxHeight: options.maxHeight || element.dataset.maxHeight || element.getAttribute('max-height') || '100px',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardexpandable' });
  element.classList.add('wb-card-expandable');
  element.innerHTML = '';

  // Build header
  if (base.config.title || base.config.subtitle) {
    element.appendChild(base.createHeader());
  }

  // Content
  const contentWrap = document.createElement('main');
  contentWrap.className = 'wb-card__expandable-content';
  contentWrap.style.cssText = `padding:1rem;overflow:hidden;transition:max-height 0.3s ease;max-height:${config.expanded ? '1000px' : config.maxHeight};`;
  contentWrap.innerHTML = base.config.content || rawContent || '<p style="margin:0;color:var(--text-secondary);">Add content here...</p>';
  // Generate ID for aria-controls
  const contentId = 'expandable-content-' + Math.random().toString(36).substr(2, 9);
  contentWrap.id = contentId;
  element.appendChild(contentWrap);

  // Expand button
  const btnWrap = document.createElement('footer');
  btnWrap.className = 'wb-card__footer';
  btnWrap.style.cssText = 'padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);';

  const btn = document.createElement('button');
  btn.className = 'wb-card__expand-btn';
  btn.style.cssText = 'width:100%;padding:0.5rem;background:var(--bg-tertiary,#374151);border:none;border-radius:6px;color:var(--text-primary,#f9fafb);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;';
  btn.setAttribute('aria-expanded', config.expanded);
  btn.setAttribute('aria-controls', contentId);
  
  const icon = document.createElement('span');
  icon.className = 'wb-card__expand-icon';
  if (config.expanded) icon.classList.add('wb-card__expand-icon--expanded');
  icon.textContent = '▼';
  icon.style.display = 'inline-block';
  icon.style.transition = 'transform 0.3s ease';
  if (config.expanded) icon.style.transform = 'rotate(180deg)';
  btn.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'wb-card__expand-text';
  text.textContent = config.expanded ? 'Show Less' : 'Show More';
  btn.appendChild(text);

  let isExpanded = config.expanded;
  if (isExpanded) element.classList.add('wb-card--expanded');
  
  const toggle = () => {
    isExpanded = !isExpanded;
    contentWrap.style.maxHeight = isExpanded ? '1000px' : config.maxHeight;
    icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    icon.classList.toggle('wb-card__expand-icon--expanded', isExpanded);
    text.textContent = isExpanded ? 'Show Less' : 'Show More';
    element.classList.toggle('wb-card--expanded', isExpanded);
    btn.setAttribute('aria-expanded', isExpanded);
    element.dispatchEvent(new CustomEvent('wb:cardexpandable:toggle', { 
      bubbles: true, 
      detail: { expanded: isExpanded } 
    }));
  };

  btn.onclick = toggle;
  
  // Keyboard support
  btn.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  btnWrap.appendChild(btn);
  element.appendChild(btnWrap);

  // Footer (extra footer if needed, though we just added one)
  if (base.config.footer) {
    const extraFooter = base.createFooter();
    // Merge content if possible or append
    element.appendChild(extraFooter);
  }

  // API
  element.wbCardExpandable = {
    expand: () => { if (!isExpanded) toggle(); },
    collapse: () => { if (isExpanded) toggle(); },
    toggle: toggle,
    get expanded() { return isExpanded; }
  };

  return base.cleanup;
}

/**
 * Card Minimizable Component
 * Custom Tag: <card-minimizable>
 */
export function cardminimizable(element: HTMLElement, options: Record<string, any> = {}) {
  // Capture existing content as fallback before clearing
  const rawContent = element.innerHTML.trim();

  const config = {
    minimized: parseBoolean(options.minimized) ?? (element.dataset.minimized === 'true' || element.getAttribute('minimized') === 'true' || (element.hasAttribute('data-minimized') && element.dataset.minimized !== 'false')),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardminimizable' });
  element.classList.add('wb-card-minimizable');
  element.classList.add('wb-card--minimizable'); // Explicitly add for compliance
  element.innerHTML = '';

  // Header with minimize button
  const header = document.createElement('header');
  header.className = 'wb-card__header';
  header.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);display:flex;align-items:center;gap:0.75rem;';

  const titleWrap = document.createElement('div');
  titleWrap.style.cssText = 'flex:1;min-width:0;';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title';
    titleEl.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    titleWrap.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'wb-card__subtitle';
    subtitleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.85rem;';
    subtitleEl.textContent = base.config.subtitle;
    titleWrap.appendChild(subtitleEl);
  }

  header.appendChild(titleWrap);

  // Minimize button
  const minBtn = document.createElement('button');
  minBtn.className = 'wb-card__minimize-btn';
  minBtn.style.cssText = 'width:32px;height:32px;background:var(--bg-secondary,#1f2937);border:1px solid var(--border-color,#374151);border-radius:6px;color:var(--text-primary,#f9fafb);font-size:1.25rem;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  minBtn.textContent = config.minimized ? '+' : '−';
  header.appendChild(minBtn);

  element.appendChild(header);

  // Content
  const content = document.createElement('main');
  content.className = 'wb-card__minimizable-content';
  content.style.cssText = `padding:1rem;overflow:hidden;transition:all 0.3s ease;${config.minimized ? 'max-height:0;padding:0 1rem;opacity:0;' : ''}`;
  content.innerHTML = base.config.content || rawContent || '<p style="margin:0;color:var(--text-secondary);">Add content here...</p>';
  element.appendChild(content);

  // Toggle
  let isMinimized = config.minimized;
  if (isMinimized) element.classList.add('wb-card--minimized');

  const toggle = () => {
    isMinimized = !isMinimized;
    content.style.maxHeight = isMinimized ? '0' : '1000px';
    content.style.padding = isMinimized ? '0 1rem' : '1rem';
    content.style.opacity = isMinimized ? '0' : '1';
    minBtn.textContent = isMinimized ? '+' : '−';
    minBtn.setAttribute('aria-expanded', String(!isMinimized));
    minBtn.setAttribute('aria-label', isMinimized ? 'Expand' : 'Minimize');
    element.classList.toggle('wb-card--minimized', isMinimized);
    
    // Update footer visibility if it exists
    const footerEl = element.querySelector('.wb-card__footer');
    if (footerEl) {
      footerEl.style.display = isMinimized ? 'none' : '';
    }

    element.dispatchEvent(new CustomEvent('wb:cardminimizable:toggle', { 
      bubbles: true, 
      detail: { minimized: isMinimized } 
    }));
  };

  minBtn.setAttribute('aria-expanded', String(!config.minimized));
  minBtn.setAttribute('aria-label', config.minimized ? 'Expand' : 'Minimize');
  minBtn.onclick = toggle;
  
  // Keyboard support
  minBtn.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  // Footer
  if (base.config.footer) {
    const footerEl = base.createFooter();
    footerEl.style.display = isMinimized ? 'none' : '';
    element.appendChild(footerEl);
  }

  // API
  element.wbCardMinimizable = {
    toggle,
    minimize: () => { if (!isMinimized) toggle(); },
    expand: () => { if (isMinimized) toggle(); },
    get minimized() { return isMinimized; }
  };

  return base.cleanup;
}

/**
 * Card Draggable Component
 * Custom Tag: <card-draggable>
 */
export function carddraggable(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    constrain: options.constrain || element.dataset.constrain || element.getAttribute('constrain') || 'none',
    axis: options.axis || element.dataset.axis || element.getAttribute('axis') || 'both',
    snapToGrid: parseInt(options.snapToGrid || element.dataset.snapToGrid || element.getAttribute('snap-to-grid') || 0),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'carddraggable' });
  element.classList.add('wb-card-draggable');
  
  element.innerHTML = '';
  element.style.position = 'relative'; // Or absolute, depending on layout
  element.classList.add('wb-card--draggable');

  // Header with drag handle
  const headerEl = document.createElement('header');
headerEl.className = 'wb-card__header wb-card__drag-handle';
    headerEl.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);cursor:grab;display:flex;align-items:center;gap:0.5rem;';
    headerEl.setAttribute('aria-label', 'Drag to move card');
    headerEl.setAttribute('role', 'button');

  const handleIcon = document.createElement('span');
  handleIcon.style.cssText = 'opacity:0.5;';
  handleIcon.textContent = '⋮⋮';
  headerEl.appendChild(handleIcon);

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title';
    titleEl.style.cssText = 'margin:0;flex:1;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    headerEl.appendChild(titleEl);
  }

  element.appendChild(headerEl);

  // Content
  const contentArea = base.createMain();
  element.appendChild(contentArea);

  // Footer
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  // Drag behavior
  let isDragging = false;
  let startX, startY, initialX, initialY;

  const onMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = element.offsetLeft;
    initialY = element.offsetTop;
    
    headerEl.style.cursor = 'grabbing';
    element.classList.add('wb-card--dragging');
    element.style.opacity = '0.8';
    element.style.zIndex = '1000';
    
    element.dispatchEvent(new CustomEvent('wb:carddraggable:dragstart', {
      bubbles: true,
      detail: { x: initialX, y: initialY }
    }));
  };

  headerEl.addEventListener('mousedown', onMouseDown);

  const onMouseMove = (e) => {
    if (!isDragging) return;
    
    let deltaX = e.clientX - startX;
    let deltaY = e.clientY - startY;
    
    // Axis constraint
    if (config.axis === 'x') deltaY = 0;
    if (config.axis === 'y') deltaX = 0;
    
    let newX = initialX + deltaX;
    let newY = initialY + deltaY;
    
    // Snap to grid
    if (config.snapToGrid > 0) {
      newX = Math.round(newX / config.snapToGrid) * config.snapToGrid;
      newY = Math.round(newY / config.snapToGrid) * config.snapToGrid;
    }
    
    // Parent constraint
    if (config.constrain === 'parent' && element.parentElement) {
      const parentRect = element.parentElement.getBoundingClientRect();
      // Assuming relative positioning within parent
      const maxX = element.parentElement.clientWidth - element.offsetWidth;
      const maxY = element.parentElement.clientHeight - element.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }
    
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
    
    element.dispatchEvent(new CustomEvent('wb:carddraggable:drag', {
      bubbles: true,
      detail: { 
        x: newX, 
        y: newY,
        deltaX: deltaX,
        deltaY: deltaY
      }
    }));
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      headerEl.style.cursor = 'grab';
      element.classList.remove('wb-card--dragging');
      element.style.opacity = '';
      element.style.zIndex = '';
      
      element.dispatchEvent(new CustomEvent('wb:carddraggable:dragend', {
        bubbles: true,
        detail: { 
          x: parseInt(element.style.left || '0', 10), 
          y: parseInt(element.style.top || '0', 10) 
        }
      }));
    }
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // API
  element.wbCardDraggable = {
    setPosition: (x, y) => {
      element.style.left = x + 'px';
      element.style.top = y + 'px';
    },
    getPosition: () => ({
      x: parseInt(element.style.left || '0', 10),
      y: parseInt(element.style.top || '0', 10)
    }),
    reset: () => {
      element.style.left = '';
      element.style.top = '';
    }
  };

  // Cleanup
  const originalCleanup = base.cleanup;
  return () => {
    originalCleanup();
    headerEl.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

// ============================================
// PORTFOLIO CARD - FULL-FEATURED
// Custom Tag: <wb-cardportfolio>
// ============================================
export function cardportfolio(element: HTMLElement, options: Record<string, any> = {}) {
  // Parse JSON attributes safely
  const parseJSON = (val) => {
    if (!val) return null;
    try { return JSON.parse(val); } catch { return null; }
  };

  const config = {
    // Identity
    name: options.name || element.dataset.name || element.getAttribute('name'),
    title: options.title || element.dataset.title || element.getAttribute('title'),
    company: options.company || element.dataset.company || element.getAttribute('company'),
    location: options.location || element.dataset.location || element.getAttribute('location'),
    tagline: options.tagline || element.dataset.tagline || element.getAttribute('tagline'),
    availability: options.availability || element.dataset.availability || element.getAttribute('availability') || 'available',
    
    // Media
    avatar: options.avatar || element.dataset.avatar || element.getAttribute('avatar'),
    cover: options.cover || element.dataset.cover || element.getAttribute('cover'),
    bio: options.bio || element.dataset.bio || element.getAttribute('bio'),
    
    // Contact
    email: options.email || element.dataset.email || element.getAttribute('email'),
    phone: options.phone || element.dataset.phone || element.getAttribute('phone'),
    website: options.website || element.dataset.website || element.getAttribute('website'),
    
    // Social
    linkedin: options.linkedin || element.dataset.linkedin || element.getAttribute('linkedin'),
    twitter: options.twitter || element.dataset.twitter || element.getAttribute('twitter'),
    github: options.github || element.dataset.github || element.getAttribute('github'),
    dribbble: options.dribbble || element.dataset.dribbble || element.getAttribute('dribbble'),
    
    // Skills & Experience
    skills: options.skills || element.dataset.skills || element.getAttribute('skills'),
    skillLevels: parseJSON(options.skillLevels || element.dataset.skillLevels || element.getAttribute('skill-levels')),
    experience: parseJSON(options.experience || element.dataset.experience || element.getAttribute('experience')),
    education: parseJSON(options.education || element.dataset.education || element.getAttribute('education')),
    projects: parseJSON(options.projects || element.dataset.projects || element.getAttribute('projects')),
    certifications: options.certifications || element.dataset.certifications || element.getAttribute('certifications'),
    languages: options.languages || element.dataset.languages || element.getAttribute('languages'),
    stats: parseJSON(options.stats || element.dataset.stats || element.getAttribute('stats')),
    
    // CTA
    cta: options.cta || element.dataset.cta || element.getAttribute('cta'),
    ctaHref: options.ctaHref || element.dataset.ctaHref || element.getAttribute('cta-href'),
    
    // Variant
    variant: options.variant || element.dataset.variant || element.getAttribute('variant') || 'default',
    size: options.size || element.dataset.size || element.getAttribute('size') || 'auto',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardportfolio', hoverable: false });
  element.classList.add('wb-portfolio');
  if (config.variant !== 'default') {
    element.classList.add(`wb-portfolio--${config.variant}`);
  }
  element.innerHTML = '';
  
  // Size handling
  if (config.variant === 'full') {
    element.style.maxWidth = '800px';
  } else if (config.size === 'auto') {
    element.style.maxWidth = '400px';
  }

  // Availability colors
  const availabilityConfig = {
    'available': { color: '#22c55e', label: 'Available for work', icon: '🟢' },
    'busy': { color: '#f59e0b', label: 'Currently busy', icon: '🟡' },
    'not-available': { color: '#ef4444', label: 'Not available', icon: '🔴' },
    'open-to-opportunities': { color: '#3b82f6', label: 'Open to opportunities', icon: '🔵' }
  };

  // ==================== COVER ====================
  if (config.cover) {
    const coverFigure = document.createElement('figure');
    coverFigure.className = 'wb-portfolio__cover';
    coverFigure.style.cssText = `margin:0;height:150px;background-image:url(${config.cover});background-size:cover;background-position:center;position:relative;`;
    element.appendChild(coverFigure);
  }

  // ==================== HEADER ====================
  const header = document.createElement('header');
  header.className = 'wb-portfolio__header';
  header.style.cssText = `text-align:center;padding:1.5rem;${config.cover ? 'margin-top:-60px;' : ''}`;

  // Avatar
  if (config.avatar) {
    const avatarWrap = document.createElement('figure');
    avatarWrap.className = 'wb-portfolio__avatar-wrap';
    avatarWrap.style.cssText = 'margin:0 auto;position:relative;display:inline-block;';
    
    const avatarImg = document.createElement('img');
    avatarImg.className = 'wb-portfolio__avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.name || 'Avatar';
    avatarImg.style.cssText = 'width:120px;height:120px;border-radius:50%;border:4px solid var(--bg-secondary,#1f2937);object-fit:cover;display:block;';
    avatarWrap.appendChild(avatarImg);

    // Availability indicator
    if (config.availability && availabilityConfig[config.availability]) {
      const availDot = document.createElement('span');
      availDot.className = 'wb-portfolio__availability';
      availDot.title = availabilityConfig[config.availability].label;
      availDot.style.cssText = `position:absolute;bottom:8px;right:8px;width:24px;height:24px;border-radius:50%;background:${availabilityConfig[config.availability].color};border:3px solid var(--bg-secondary,#1f2937);cursor:help;`;
      avatarWrap.appendChild(availDot);
    }
    
    header.appendChild(avatarWrap);
  }

  // Name
  if (config.name) {
    const nameEl = document.createElement('h2');
    nameEl.className = 'wb-portfolio__name';
    nameEl.style.cssText = 'margin:1rem 0 0;font-size:1.75rem;font-weight:700;color:var(--text-primary,#f9fafb);';
    nameEl.textContent = config.name;
    header.appendChild(nameEl);
  }

  // Title & Company
  if (config.title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'wb-portfolio__title';
    titleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--primary,#6366f1);font-weight:600;font-size:1.1rem;';
    titleEl.textContent = config.title + (config.company ? ` at ${config.company}` : '');
    header.appendChild(titleEl);
  } else if (config.company) {
    const companyEl = document.createElement('p');
    companyEl.className = 'wb-portfolio__company';
    companyEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-secondary,#9ca3af);';
    companyEl.textContent = config.company;
    header.appendChild(companyEl);
  }

  // Location
  if (config.location) {
    const locEl = document.createElement('p');
    locEl.className = 'wb-portfolio__location';
    locEl.style.cssText = 'margin:0.5rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.9rem;';
    locEl.textContent = `📍 ${config.location}`;
    header.appendChild(locEl);
  }

  // Tagline
  if (config.tagline) {
    const tagEl = document.createElement('p');
    tagEl.className = 'wb-portfolio__tagline';
    tagEl.style.cssText = 'margin:0.75rem 0 0;color:var(--text-secondary,#9ca3af);font-style:italic;font-size:0.95rem;';
    tagEl.textContent = `"${config.tagline}"`;
    header.appendChild(tagEl);
  }

  element.appendChild(header);

  // ==================== MAIN CONTENT ====================
  const main = document.createElement('main');
  main.className = 'wb-portfolio__main';
  main.style.cssText = 'padding:0 1.5rem 1.5rem;';

  // Bio Section
  if (config.bio) {
    const bioSection = document.createElement('section');
    bioSection.className = 'wb-portfolio__bio';
    bioSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const bioText = document.createElement('p');
    bioText.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);font-size:0.95rem;line-height:1.7;';
    bioText.textContent = config.bio;
    bioSection.appendChild(bioText);
    main.appendChild(bioSection);
  }

  // Stats Section
  if (config.stats && config.stats.length > 0) {
    const statsSection = document.createElement('section');
    statsSection.className = 'wb-portfolio__stats';
    statsSection.style.cssText = 'display:flex;justify-content:space-around;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:8px;margin-bottom:1.5rem;';
    
    config.stats.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.style.cssText = 'text-align:center;';
      
      const valueEl = document.createElement('div');
      valueEl.style.cssText = 'font-size:1.5rem;font-weight:700;color:var(--primary,#6366f1);';
      valueEl.textContent = stat.value;
      statItem.appendChild(valueEl);
      
      const labelEl = document.createElement('div');
      labelEl.style.cssText = 'font-size:0.8rem;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
      labelEl.textContent = stat.label;
      statItem.appendChild(labelEl);
      
      statsSection.appendChild(statItem);
    });
    main.appendChild(statsSection);
  }

  // Skills Section
  if (config.skills || config.skillLevels) {
    const skillsSection = document.createElement('section');
    skillsSection.className = 'wb-portfolio__skills';
    skillsSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const skillsTitle = document.createElement('h3');
    skillsTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    skillsTitle.textContent = '🛠️ Skills';
    skillsSection.appendChild(skillsTitle);

    // Skill pills (from comma-separated string)
    if (config.skills) {
      const skillPills = document.createElement('div');
      skillPills.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;';
      
      config.skills.split(',').forEach(skill => {
        const pill = document.createElement('span');
        pill.style.cssText = 'padding:0.35rem 0.75rem;background:var(--bg-tertiary,#374151);color:var(--text-primary,#f9fafb);border-radius:999px;font-size:0.85rem;';
        pill.textContent = skill.trim();
        skillPills.appendChild(pill);
      });
      skillsSection.appendChild(skillPills);
    }

    // Skill bars (from JSON array)
    if (config.skillLevels && config.skillLevels.length > 0) {
      const skillBars = document.createElement('div');
      skillBars.style.cssText = 'margin-top:0.75rem;';
      
      config.skillLevels.forEach(skill => {
        const skillRow = document.createElement('div');
        skillRow.style.cssText = 'margin-bottom:0.5rem;';
        
        const skillHeader = document.createElement('div');
        skillHeader.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.85rem;';
        skillHeader.innerHTML = `<span style="color:var(--text-primary,#f9fafb);">${skill.name}</span><span style="color:var(--text-secondary,#9ca3af);">${skill.level}%</span>`;
        skillRow.appendChild(skillHeader);
        
        const barBg = document.createElement('div');
        barBg.style.cssText = 'height:6px;background:var(--bg-tertiary,#374151);border-radius:3px;overflow:hidden;';
        
        const barFill = document.createElement('div');
        barFill.style.cssText = `width:${skill.level}%;height:100%;background:var(--primary,#6366f1);border-radius:3px;transition:width 0.5s ease;`;
        barBg.appendChild(barFill);
        skillRow.appendChild(barBg);
        
        skillBars.appendChild(skillRow);
      });
      skillsSection.appendChild(skillBars);
    }
    
    main.appendChild(skillsSection);
  }

  // Experience Section
  if (config.experience && config.experience.length > 0) {
    const expSection = document.createElement('section');
    expSection.className = 'wb-portfolio__experience';
    expSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const expTitle = document.createElement('h3');
    expTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    expTitle.textContent = '💼 Experience';
    expSection.appendChild(expTitle);

    config.experience.forEach((exp, i) => {
      const expItem = document.createElement('div');
      expItem.style.cssText = `padding:0.75rem 0;${i > 0 ? 'border-top:1px solid var(--border-color,#374151);' : ''}`;
      
      const expHeader = document.createElement('div');
      expHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap;';
      
      const expRole = document.createElement('strong');
      expRole.style.cssText = 'color:var(--text-primary,#f9fafb);';
      expRole.textContent = exp.role || exp.title;
      expHeader.appendChild(expRole);
      
      if (exp.period) {
        const expPeriod = document.createElement('span');
        expPeriod.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.85rem;';
        expPeriod.textContent = exp.period;
        expHeader.appendChild(expPeriod);
      }
      expItem.appendChild(expHeader);
      
      if (exp.company) {
        const expCompany = document.createElement('div');
        expCompany.style.cssText = 'color:var(--primary,#6366f1);font-size:0.9rem;margin-top:0.25rem;';
        expCompany.textContent = exp.company;
        expItem.appendChild(expCompany);
      }
      
      if (exp.description) {
        const expDesc = document.createElement('p');
        expDesc.style.cssText = 'margin:0.5rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.9rem;line-height:1.5;';
        expDesc.textContent = exp.description;
        expItem.appendChild(expDesc);
      }
      
      expSection.appendChild(expItem);
    });
    main.appendChild(expSection);
  }

  // Education Section
  if (config.education && config.education.length > 0) {
    const eduSection = document.createElement('section');
    eduSection.className = 'wb-portfolio__education';
    eduSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const eduTitle = document.createElement('h3');
    eduTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    eduTitle.textContent = '🎓 Education';
    eduSection.appendChild(eduTitle);

    config.education.forEach(edu => {
      const eduItem = document.createElement('div');
      eduItem.style.cssText = 'padding:0.5rem 0;';
      
      const eduDegree = document.createElement('strong');
      eduDegree.style.cssText = 'color:var(--text-primary,#f9fafb);display:block;';
      eduDegree.textContent = edu.degree;
      eduItem.appendChild(eduDegree);
      
      const eduSchool = document.createElement('span');
      eduSchool.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.9rem;';
      eduSchool.textContent = edu.school + (edu.year ? ` • ${edu.year}` : '');
      eduItem.appendChild(eduSchool);
      
      eduSection.appendChild(eduItem);
    });
    main.appendChild(eduSection);
  }

  // Projects Section
  if (config.projects && config.projects.length > 0) {
    const projSection = document.createElement('section');
    projSection.className = 'wb-portfolio__projects';
    projSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const projTitle = document.createElement('h3');
    projTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    projTitle.textContent = '🚀 Projects';
    projSection.appendChild(projTitle);

    const projGrid = document.createElement('div');
    projGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;';

    config.projects.forEach(proj => {
      const projCard = document.createElement('a');
      projCard.href = proj.url || '#';
      projCard.target = proj.url ? '_blank' : '_self';
      projCard.style.cssText = 'display:block;background:var(--bg-tertiary,#374151);border-radius:8px;overflow:hidden;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s;';
      projCard.onmouseenter = () => { projCard.style.transform = 'translateY(-2px)'; projCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; };
      projCard.onmouseleave = () => { projCard.style.transform = ''; projCard.style.boxShadow = ''; };
      
      if (proj.image) {
        const projImg = document.createElement('img');
        projImg.src = proj.image;
        projImg.alt = proj.name;
        projImg.style.cssText = 'width:100%;height:100px;object-fit:cover;';
        projCard.appendChild(projImg);
      }
      
      const projInfo = document.createElement('div');
      projInfo.style.cssText = 'padding:0.75rem;';
      
      const projName = document.createElement('strong');
      projName.style.cssText = 'color:var(--text-primary,#f9fafb);display:block;margin-bottom:0.25rem;';
      projName.textContent = proj.name;
      projInfo.appendChild(projName);
      
      if (proj.description) {
        const projDesc = document.createElement('span');
        projDesc.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.8rem;';
        projDesc.textContent = proj.description;
        projInfo.appendChild(projDesc);
      }
      
      projCard.appendChild(projInfo);
      projGrid.appendChild(projCard);
    });
    
    projSection.appendChild(projGrid);
    main.appendChild(projSection);
  }

  // Certifications
  if (config.certifications) {
    const certSection = document.createElement('section');
    certSection.className = 'wb-portfolio__certifications';
    certSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const certTitle = document.createElement('h3');
    certTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    certTitle.textContent = '🏆 Certifications';
    certSection.appendChild(certTitle);
    
    const certList = document.createElement('ul');
    certList.style.cssText = 'margin:0;padding-left:1.25rem;color:var(--text-primary,#f9fafb);font-size:0.9rem;';
    
    config.certifications.split(',').forEach(cert => {
      const li = document.createElement('li');
      li.style.cssText = 'margin-bottom:0.25rem;';
      li.textContent = cert.trim();
      certList.appendChild(li);
    });
    certSection.appendChild(certList);
    main.appendChild(certSection);
  }

  // Languages
  if (config.languages) {
    const langSection = document.createElement('section');
    langSection.className = 'wb-portfolio__languages';
    langSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const langTitle = document.createElement('h3');
    langTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    langTitle.textContent = '🌐 Languages';
    langSection.appendChild(langTitle);
    
    const langPills = document.createElement('div');
    langPills.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;';
    
    config.languages.split(',').forEach(lang => {
      const pill = document.createElement('span');
      pill.style.cssText = 'padding:0.35rem 0.75rem;background:var(--bg-tertiary,#374151);color:var(--text-primary,#f9fafb);border-radius:999px;font-size:0.85rem;';
      pill.textContent = lang.trim();
      langPills.appendChild(pill);
    });
    langSection.appendChild(langPills);
    main.appendChild(langSection);
  }

  element.appendChild(main);

  // ==================== CONTACT ====================
  if (config.email || config.phone || config.website) {
    const contact = document.createElement('address');
    contact.className = 'wb-portfolio__contact';
    contact.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);font-style:normal;display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;';

    const contactItems = [
      { value: config.email, href: `mailto:${config.email}`, icon: '📧' },
      { value: config.phone, href: `tel:${config.phone}`, icon: '📱' },
      { value: config.website, href: config.website, icon: '🌐', external: true }
    ];

    contactItems.forEach(item => {
      if (item.value) {
        const link = document.createElement('a');
        link.href = item.href;
        if (item.external) link.target = '_blank';
        link.style.cssText = 'color:var(--text-primary,#f9fafb);text-decoration:none;font-size:0.9rem;display:flex;align-items:center;gap:0.25rem;';
        link.innerHTML = `${item.icon} <span>${item.value}</span>`;
        contact.appendChild(link);
      }
    });

    element.appendChild(contact);
  }

  // ==================== SOCIAL ====================
  const socialLinks = [
    { url: config.linkedin, icon: '💼', label: 'LinkedIn' },
    { url: config.twitter, icon: '🐦', label: 'Twitter' },
    { url: config.github, icon: '🐙', label: 'GitHub' },
    { url: config.dribbble, icon: '🏀', label: 'Dribbble' }
  ].filter(s => s.url);

  if (socialLinks.length > 0) {
    const social = document.createElement('nav');
    social.className = 'wb-portfolio__social';
    social.setAttribute('aria-label', 'Social links');
    social.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);display:flex;justify-content:center;gap:0.75rem;';

    socialLinks.forEach(({ url, icon, label }) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.title = label;
      link.setAttribute('aria-label', label);
      link.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary,#374151);border-radius:50%;text-decoration:none;font-size:1.25rem;transition:transform 0.2s,background 0.2s;';
      link.onmouseenter = () => { link.style.transform = 'scale(1.1)'; link.style.background = 'var(--primary,#6366f1)'; };
      link.onmouseleave = () => { link.style.transform = ''; link.style.background = 'var(--bg-tertiary,#374151)'; };
      link.textContent = icon;
      social.appendChild(link);
    });

    element.appendChild(social);
  }

  // ==================== CTA FOOTER ====================
  if (config.cta) {
    const footer = document.createElement('footer');
    footer.className = 'wb-portfolio__footer';
    footer.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);';
    
    const ctaBtn = document.createElement('a');
    ctaBtn.href = config.ctaHref || '#';
    ctaBtn.className = 'wb-portfolio__cta';
    ctaBtn.style.cssText = 'display:block;text-align:center;padding:0.875rem;background:var(--primary,#6366f1);color:white;text-decoration:none;border-radius:8px;font-weight:600;transition:all 0.2s;';
    ctaBtn.onmouseenter = () => { ctaBtn.style.background = 'var(--primary-hover,#4f46e5)'; ctaBtn.style.transform = 'translateY(-1px)'; };
    ctaBtn.onmouseleave = () => { ctaBtn.style.background = 'var(--primary,#6366f1)'; ctaBtn.style.transform = ''; };
    ctaBtn.textContent = config.cta;
    footer.appendChild(ctaBtn);
    
    element.appendChild(footer);
  }

  // API
  element.wbPortfolio = {
    setAvailability: (status) => {
      const dot = element.querySelector('.wb-portfolio__availability') as HTMLElement | null;
      if (dot && availabilityConfig[status]) {
        dot.style.background = availabilityConfig[status].color;
        dot.title = availabilityConfig[status].label;
      }
    }
  };

  return base.cleanup;
}

// ============================================
// EXPORTED CONSTANTS
// ============================================
export const CARD_TYPES = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 
  'cardprofile', 'cardpricing', 'cardstats', 'cardtestimonial', 
  'cardproduct', 'cardnotification', 'cardfile', 'cardlink', 
  'cardhorizontal', 'carddraggable', 'cardexpandable', 
  'cardminimizable', 'cardoverlay', 'cardportfolio'
];

export default card;
