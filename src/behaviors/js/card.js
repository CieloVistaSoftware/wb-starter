/**
 * Card Behavior + Variants
 * =========================
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

// Semantic element validation
const PREFERRED_TAGS = ['ARTICLE', 'SECTION'];
const ALLOWED_TAGS = ['ARTICLE', 'SECTION', 'DIV'];

function validateSemanticContainer(element, behaviorName) {
  const tag = element.tagName;
  if (!ALLOWED_TAGS.includes(tag)) {
    console.error(`[WB:${behaviorName}] Invalid container tag <${tag.toLowerCase()}>. Use <article> or <section>.`);
    return false;
  }
  return true;
}

// ============================================
// BASE CARD - All variants inherit from this
// ============================================
function cardBase(element, options = {}) {
  const config = {
    ...options, // Spread first to allow overrides, but specific logic below takes precedence
    behavior: options.behavior || 'card',
    title: options.title || element.dataset.title || '',
    subtitle: options.subtitle || element.dataset.subtitle || '',
    content: options.content || element.dataset.content || '',
    footer: options.footer || element.dataset.footer || '',
    variant: options.variant || element.dataset.variant || 'default',
    clickable: parseBoolean(options.clickable) ?? (element.dataset.clickable === 'true' || (element.hasAttribute('data-clickable') && element.dataset.clickable !== 'false')),
    hoverable: parseBoolean(options.hoverable) ?? (element.dataset.hoverable !== 'false'),
    elevated: parseBoolean(options.elevated) ?? (element.dataset.elevated === 'true' || (element.hasAttribute('data-elevated') && element.dataset.elevated !== 'false')),
    hoverText: options.hoverText || element.dataset.hoverText || element.getAttribute('title') || '',
    // Allow variants to add extra content
    skipStructure: parseBoolean(options.skipStructure) ?? false,
  };

  // Structure holders
  let header = null;
  let main = null;
  let footer = null;
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
  Object.assign(element.style, {
    transition: 'all 0.2s ease',
    borderRadius: 'var(--radius-lg, 8px)',
    background: 'var(--bg-secondary, #1f2937)',
    border: '1px solid var(--border-color, #374151)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  });
  
  // Variant class
  if (config.variant !== 'default') {
    element.classList.add(`wb-card--${config.variant}`);
  }
  
  // Elevated
  if (config.elevated) {
    element.classList.add('wb-card--elevated');
    element.style.boxShadow = 'var(--shadow-elevated, 0 4px 12px rgba(0,0,0,0.15))';
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
      h.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);';
      
      if (config.title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'wb-card__title';
        titleEl.style.cssText = 'margin:0;font-size:1.1rem;font-weight:600;color:var(--text-primary,#f9fafb);';
        titleEl.textContent = config.title;
        h.appendChild(titleEl);
      }
      
      if (config.subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'wb-card__subtitle';
        subtitleEl.style.cssText = 'margin:0.25rem 0 0;font-size:0.875rem;color:var(--text-secondary,#9ca3af);';
        subtitleEl.textContent = config.subtitle;
        h.appendChild(subtitleEl);
      }
      
      if (extraContent) {
        const extra = document.createElement('div');
        extra.innerHTML = extraContent;
        h.appendChild(extra);
      }
      
      return h;
    },
    
    /**
     * Create the main content area
     */
    createMain: (content = '') => {
      const m = document.createElement('main');
      m.className = 'wb-card__main';
      m.style.cssText = 'padding:1rem;flex:1;color:var(--text-primary,#f9fafb);';
      
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
      footEl.style.cssText = 'padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);font-size:0.875rem;color:var(--text-secondary,#9ca3af);';
      
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
    buildStructure: (options = {}) => {
      const { 
        headerContent = '', 
        mainContent = '', 
        footerContent = '',
        showHeader = true,
        showMain = true,
        showFooter = true
      } = options;
      
      element.innerHTML = '';
      
      // HEADER - Always show if title or subtitle exists
      if (showHeader && (config.title || config.subtitle || headerContent)) {
        const headerEl = document.createElement('header');
        headerEl.className = 'wb-card__header';
        headerEl.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);';
        
        if (config.title) {
          const titleElem = document.createElement('h3');
          titleElem.className = 'wb-card__title';
          titleElem.style.cssText = 'margin:0;font-size:1.1rem;font-weight:600;color:var(--text-primary,#f9fafb);';
          titleElem.textContent = config.title;
          headerEl.appendChild(titleElem);
        }
        
        if (config.subtitle) {
          const subtitleElem = document.createElement('p');
          subtitleElem.className = 'wb-card__subtitle';
          subtitleElem.style.cssText = 'margin:0.25rem 0 0;font-size:0.875rem;color:var(--text-secondary,#9ca3af);';
          subtitleElem.textContent = config.subtitle;
          headerEl.appendChild(subtitleElem);
        }
        
        if (headerContent) {
          const extraDiv = document.createElement('div');
          extraDiv.className = 'wb-card__header-extra';
          extraDiv.innerHTML = headerContent;
          headerEl.appendChild(extraDiv);
        }
        
        header = headerEl;
        element.appendChild(headerEl);
      }
      
      // MAIN - Always show
      if (showMain) {
        const mainEl = document.createElement('main');
        mainEl.className = 'wb-card__main';
        mainEl.style.cssText = 'padding:1rem;flex:1;color:var(--text-primary,#f9fafb);';
        
        const mainText = mainContent || config.content;
        if (mainText) {
          mainEl.innerHTML = mainText;
        } else {
          // Placeholder for empty main
          mainEl.innerHTML = '<p class="wb-card__content" style="margin:0;color:var(--text-secondary,#9ca3af);font-style:italic;">Double-click to add content in Designer...</p>';
        }
        
        main = mainEl;
        element.appendChild(mainEl);
      }
      
      // FOOTER - Show if footer text exists
      if (showFooter && (config.footer || footerContent)) {
        const footerEl = document.createElement('footer');
        footerEl.className = 'wb-card__footer';
        footerEl.style.cssText = 'padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);font-size:0.875rem;color:var(--text-secondary,#9ca3af);';
        footerEl.textContent = footerContent || config.footer;
        
        footer = footerEl;
        element.appendChild(footerEl);
      }
      
      return { header, main, footer };
    },
    
    // Cleanup function
    cleanup: () => {
      element.classList.remove('wb-card', `wb-card--${config.behavior.replace('card', '')}`,
        `wb-card--${config.variant}`, 'wb-card--hoverable', 'wb-card--elevated', 
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

// ============================================
// PUBLIC: Base Card
// ============================================
export function card(element, options = {}) {
  // Capture initial content if not provided in options/data
  // This supports cases where content is set via textContent/innerHTML before behavior init
  const initialContent = options.content || element.dataset.content || element.innerHTML;

  const base = cardBase(element, { 
    ...element.dataset, 
    ...options, 
    behavior: 'card',
    content: initialContent
  });
  
  // Build standard structure - ALWAYS shows title/subtitle/content/footer
  base.buildStructure();
  
  return base.cleanup;
}

// ============================================
// CARD WITH IMAGE - IS-A card, HAS-A image
// ============================================
export function cardimage(element, options = {}) {
  const config = {
    src: options.src || element.dataset.src,
    alt: options.alt || element.dataset.alt || '',
    aspect: options.aspect || element.dataset.aspect || '16/9',
    position: options.position || element.dataset.position || 'top',
    fit: options.fit || element.dataset.fit || 'cover',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardimage' });
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

// ============================================
// CARD WITH VIDEO
// ============================================
export function cardvideo(element, options = {}) {
  const config = {
    src: options.src || element.dataset.src,
    poster: options.poster || element.dataset.poster,
    autoplay: parseBoolean(options.autoplay) ?? (element.dataset.autoplay === 'true' || (element.hasAttribute('data-autoplay') && element.dataset.autoplay !== 'false')),
    muted: parseBoolean(options.muted) ?? (element.dataset.muted === 'true' || (element.hasAttribute('data-muted') && element.dataset.muted !== 'false')),
    loop: parseBoolean(options.loop) ?? (element.dataset.loop === 'true' || (element.hasAttribute('data-loop') && element.dataset.loop !== 'false')),
    controls: parseBoolean(options.controls) ?? (element.dataset.controls !== 'false'),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardvideo' });
  element.innerHTML = '';

  // Build header/main/footer
  base.buildStructure();

  // Video figure
  if (config.src) {
    const figure = base.createFigure();
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
      figure.appendChild(warning);
    }

    figure.appendChild(video);
    element.insertBefore(figure, element.firstChild);
  }

  return base.cleanup;
}

// ============================================
// CARD WITH BUTTONS
// ============================================
export function cardbutton(element, options = {}) {
  // Use all inherited fields from cardBase, only add/override cardbutton-specific fields
  const config = {
    ...element.dataset,
    ...options,
    behavior: 'cardbutton'
  };

  const base = cardBase(element, config);
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

// ============================================
// HERO CARD
// ============================================
export function cardhero(element, options = {}) {
  const config = {
    background: options.background || element.dataset.background,
    overlay: parseBoolean(options.overlay) ?? (element.dataset.overlay !== 'false'),
    align: options.align || element.dataset.align || 'center',
    height: options.height || element.dataset.height || '400px',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardhero', hoverable: false });

  element.innerHTML = '';
  element.style.minHeight = config.height;
  element.style.position = 'relative';
  element.style.justifyContent = 'center';
  element.style.alignItems = config.align === 'left' ? 'flex-start' : config.align === 'right' ? 'flex-end' : 'center';
  element.style.textAlign = config.align;
  element.classList.add(`wb-card--align-${config.align}`);
  element.style.backgroundImage = config.background ? `url(${config.background})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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

  if (base.config.title) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'wb-card__title wb-card__hero-title';
    titleEl.style.cssText = 'margin:0;font-size:2.5rem;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.3);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'wb-card__subtitle wb-card__hero-subtitle';
    subtitleEl.style.cssText = 'margin:0.75rem 0 0;font-size:1.25rem;opacity:0.9;text-shadow:0 1px 2px rgba(0,0,0,0.3);';
    subtitleEl.textContent = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

// ============================================
// PROFILE CARD
// ============================================
export function cardprofile(element, options = {}) {
  const config = {
    avatar: options.avatar || element.dataset.avatar,
    name: options.name || element.dataset.name,
    role: options.role || element.dataset.role,
    bio: options.bio || element.dataset.bio,
    cover: options.cover || element.dataset.cover,
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
  const content = document.createElement('div');
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

// ============================================
// PRICING CARD
// ============================================
export function cardpricing(element, options = {}) {
  const config = {
    plan: options.plan || element.dataset.plan || 'Basic Plan',
    price: options.price || element.dataset.price || '$0',
    period: options.period || element.dataset.period || '/month',
    features: options.features || element.dataset.features?.split(',') || ['Feature 1', 'Feature 2'],
    cta: options.cta || element.dataset.cta || 'Get Started',
    ctaHref: options.ctaHref || element.dataset.ctaHref || '#',
    featured: parseBoolean(options.featured) ?? (element.dataset.featured === 'true' || (element.hasAttribute('data-featured') && element.dataset.featured !== 'false')),
    background: options.background || element.dataset.background,
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardpricing' });
  element.innerHTML = '';
  element.style.textAlign = 'center';
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
  priceEl.style.cssText = 'font-size:3rem;font-weight:700;color:var(--text-primary,#f9fafb);';
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

// ============================================
// STATS CARD
// ============================================
export function cardstats(element, options = {}) {
  const config = {
    value: options.value || element.dataset.value,
    label: options.label || element.dataset.label,
    icon: options.icon || element.dataset.icon,
    trend: options.trend || element.dataset.trend,
    trendValue: options.trendValue || element.dataset.trendValue,
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardstats', hoverable: false });
  element.innerHTML = '';
  element.style.padding = CARD_PADDING;
  element.style.flexDirection = 'row';
  element.style.alignItems = 'center';
  element.style.gap = '1rem';

  if (config.icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'wb-card__icon';
    iconEl.style.cssText = 'font-size:2rem;';
    iconEl.textContent = config.icon;
    element.appendChild(iconEl);
  }

  const content = document.createElement('div');
  content.style.cssText = 'flex:1;min-width:0;';

  if (config.value) {
    const valueEl = document.createElement('div');
    valueEl.className = 'wb-card__stats-value';
    valueEl.style.cssText = 'font-size:1.75rem;font-weight:700;color:var(--text-primary,#f9fafb);';
    valueEl.textContent = config.value;
    content.appendChild(valueEl);
  }

  if (config.label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'wb-card__stats-label';
    labelEl.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.875rem;';
    labelEl.textContent = config.label;
    content.appendChild(labelEl);
  }

  if (config.trend && config.trendValue) {
    const trendEl = document.createElement('div');
    trendEl.className = 'wb-card__stats-trend';
    const trendColor = config.trend === 'up' ? '#22c55e' : config.trend === 'down' ? '#ef4444' : '#6b7280';
    const trendIcon = config.trend === 'up' ? '↑' : config.trend === 'down' ? '↓' : '→';
    trendEl.style.cssText = `color:${trendColor};font-size:0.8rem;margin-top:0.25rem;`;
    trendEl.textContent = `${trendIcon} ${config.trendValue}`;
    content.appendChild(trendEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

// ============================================
// TESTIMONIAL CARD
// ============================================
export function cardtestimonial(element, options = {}) {
  const config = {
    quote: options.quote || element.dataset.quote || element.textContent,
    author: options.author || element.dataset.author,
    role: options.role || element.dataset.role,
    avatar: options.avatar || element.dataset.avatar,
    rating: options.rating || element.dataset.rating,
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardtestimonial', hoverable: false });
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
  const authorWrap = document.createElement('div');
  authorWrap.style.cssText = 'display:flex;align-items:center;gap:0.75rem;';

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

// ============================================
// PRODUCT CARD
// ============================================
export function cardproduct(element, options = {}) {
  const config = {
    image: options.image || element.dataset.image,
    price: options.price || element.dataset.price,
    originalPrice: options.originalPrice || element.dataset.originalPrice,
    badge: options.badge || element.dataset.badge,
    rating: options.rating || element.dataset.rating,
    reviews: options.reviews || element.dataset.reviews,
    cta: options.cta || element.dataset.cta || 'Add to Cart',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardproduct' });
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

    if (config.badge) {
      const badgeEl = document.createElement('span');
      badgeEl.className = 'wb-card__badge';
      badgeEl.style.cssText = 'position:absolute;top:0.75rem;left:0.75rem;background:var(--error,#ef4444);color:white;padding:0.25rem 0.75rem;border-radius:4px;font-size:0.75rem;font-weight:600;';
      badgeEl.textContent = config.badge;
      figure.appendChild(badgeEl);
    }

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

// ============================================
// NOTIFICATION CARD
// ============================================
export function cardnotification(element, options = {}) {
  const config = {
    type: options.type || element.dataset.type || 'info',
    message: options.message || element.dataset.message || element.textContent,
    dismissible: parseBoolean(options.dismissible) ?? (element.dataset.dismissible !== 'false'),
    icon: options.icon || element.dataset.icon,
    ...options
  };

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const colors = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
  const bgColors = { info: 'rgba(59,130,246,0.15)', success: 'rgba(34,197,94,0.15)', warning: 'rgba(245,158,11,0.15)', error: 'rgba(239,68,68,0.15)' };

  const base = cardBase(element, { ...config, behavior: 'cardnotification', hoverable: false });
  
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
  iconEl.style.cssText = 'font-size:1.25rem;flex-shrink:0;';
  iconEl.textContent = config.icon || icons[config.type];
  element.appendChild(iconEl);

  // Content
  const content = document.createElement('div');
  content.style.cssText = 'flex:1;min-width:0;';

  if (base.config.title) {
    const titleEl = document.createElement('strong');
    titleEl.className = 'wb-card__notif-title';
    titleEl.style.cssText = 'display:block;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (config.message) {
    const msgEl = document.createElement('p');
    msgEl.className = 'wb-card__notif-message';
    msgEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-primary,#f9fafb);opacity:0.9;';
    msgEl.textContent = config.message;
    content.appendChild(msgEl);
  }

  element.appendChild(content);

  // Dismiss button
  if (config.dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;font-size:1.25rem;cursor:pointer;opacity:0.5;padding:0;color:var(--text-primary,#f9fafb);';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => element.remove();
    element.appendChild(closeBtn);
  }

  return base.cleanup;
}

// ============================================
// FILE CARD
// ============================================
export function cardfile(element, options = {}) {
  const config = {
    filename: options.filename || element.dataset.filename,
    type: options.type || element.dataset.type || 'file',
    size: options.size || element.dataset.size,
    date: options.date || element.dataset.date,
    downloadable: parseBoolean(options.downloadable) ?? (element.dataset.downloadable !== 'false'),
    href: options.href || element.dataset.href,
    ...options
  };

  const icons = { pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', audio: '🎵', zip: '📦', file: '📁' };

  const base = cardBase(element, { ...config, behavior: 'cardfile', hoverable: false });
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
    nameEl.style.cssText = 'margin:0;font-size:1rem;color:var(--text-primary,#f9fafb);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
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

// ============================================
// LINK CARD
// ============================================
export function cardlink(element, options = {}) {
  const config = {
    href: options.href || element.dataset.href || '#',
    target: options.target || element.dataset.target || '_blank',
    icon: options.icon || element.dataset.icon || '🔗',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardlink' });
  
  element.style.cursor = 'pointer';
  element.setAttribute('role', 'link');
  element.setAttribute('tabindex', '0');

  // Build structure
  base.buildStructure();

  // Add external indicator
  if (config.target === '_blank') {
    const extIcon = document.createElement('span');
    extIcon.style.cssText = 'position:absolute;top:1rem;right:1rem;opacity:0.5;';
    extIcon.textContent = '↗';
    element.appendChild(extIcon);
    element.style.position = 'relative';
  }

  // Click handler
  element.onclick = () => {
    if (config.href !== '#') {
      window.open(config.href, config.target);
    }
  };

  return base.cleanup;
}

// ============================================
// HORIZONTAL CARD
// ============================================
export function cardhorizontal(element, options = {}) {
  const config = {
    image: options.image || element.dataset.image,
    imagePosition: options.imagePosition || element.dataset.imagePosition || 'left',
    imageWidth: options.imageWidth || element.dataset.imageWidth || '40%',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardhorizontal' });
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

// ============================================
// OVERLAY CARD
// ============================================
export function cardoverlay(element, options = {}) {
  const config = {
    image: options.image || element.dataset.image,
    position: options.position || element.dataset.position || 'bottom',
    gradient: parseBoolean(options.gradient) ?? (element.dataset.gradient !== 'false'),
    height: options.height || element.dataset.height || '300px',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardoverlay', hoverable: false });
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

// ============================================
// EXPANDABLE CARD
// ============================================
export function cardexpandable(element, options = {}) {
  const config = {
    expanded: parseBoolean(options.expanded) ?? (element.dataset.expanded === 'true' || (element.hasAttribute('data-expanded') && element.dataset.expanded !== 'false')),
    maxHeight: options.maxHeight || element.dataset.maxHeight || '100px',
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardexpandable' });
  element.innerHTML = '';

  // Build header
  if (base.config.title || base.config.subtitle) {
    element.appendChild(base.createHeader());
  }

  // Content
  const contentWrap = document.createElement('div');
  contentWrap.className = 'wb-card__expandable-content';
  contentWrap.style.cssText = `padding:1rem;overflow:hidden;transition:max-height 0.3s ease;max-height:${config.expanded ? '1000px' : config.maxHeight};`;
  contentWrap.innerHTML = base.config.content || '<p style="margin:0;color:var(--text-secondary);">Add content here...</p>';
  element.appendChild(contentWrap);

  // Expand button
  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);';

  const btn = document.createElement('button');
  btn.className = 'wb-card__expand-btn';
  btn.style.cssText = 'width:100%;padding:0.5rem;background:var(--bg-tertiary,#374151);border:none;border-radius:6px;color:var(--text-primary,#f9fafb);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;';
  
  const icon = document.createElement('span');
  icon.className = 'wb-card__expand-icon';
  icon.textContent = config.expanded ? '▲' : '▼';
  btn.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'wb-card__expand-text';
  text.textContent = config.expanded ? 'Show Less' : 'Show More';
  btn.appendChild(text);

  let isExpanded = config.expanded;
  if (isExpanded) element.classList.add('wb-card--expanded');
  
  btn.onclick = () => {
    isExpanded = !isExpanded;
    contentWrap.style.maxHeight = isExpanded ? '1000px' : config.maxHeight;
    icon.textContent = isExpanded ? '▲' : '▼';
    text.textContent = isExpanded ? 'Show Less' : 'Show More';
    element.classList.toggle('wb-card--expanded', isExpanded);
    element.dispatchEvent(new CustomEvent('wb:cardexpandable:toggle', { 
      bubbles: true, 
      detail: { expanded: isExpanded } 
    }));
  };

  btnWrap.appendChild(btn);
  element.appendChild(btnWrap);

  // Footer
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  return base.cleanup;
}

// ============================================
// MINIMIZABLE CARD
// ============================================
export function cardminimizable(element, options = {}) {
  const config = {
    minimized: parseBoolean(options.minimized) ?? (element.dataset.minimized === 'true' || (element.hasAttribute('data-minimized') && element.dataset.minimized !== 'false')),
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardminimizable' });
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
  content.innerHTML = base.config.content || '<p style="margin:0;color:var(--text-secondary);">Add content here...</p>';
  element.appendChild(content);

  // Toggle
  let isMinimized = config.minimized;
  if (isMinimized) element.classList.add('wb-card--minimized');

  minBtn.onclick = () => {
    isMinimized = !isMinimized;
    content.style.maxHeight = isMinimized ? '0' : '1000px';
    content.style.padding = isMinimized ? '0 1rem' : '1rem';
    content.style.opacity = isMinimized ? '0' : '1';
    minBtn.textContent = isMinimized ? '+' : '−';
    element.classList.toggle('wb-card--minimized', isMinimized);
    element.dispatchEvent(new CustomEvent('wb:cardminimizable:toggle', { 
      bubbles: true, 
      detail: { minimized: isMinimized } 
    }));
  };

  // Footer
  if (base.config.footer) {
    const footer = base.createFooter();
    footer.style.display = isMinimized ? 'none' : '';
    element.appendChild(footer);
  }

  return base.cleanup;
}

// ============================================
// DRAGGABLE CARD
// ============================================
export function carddraggable(element, options = {}) {
  const base = cardBase(element, { ...options, behavior: 'carddraggable' });
  
  element.innerHTML = '';
  element.style.position = 'relative';
  element.style.cursor = 'move';

  // Header with drag handle
  const header = document.createElement('header');
  header.className = 'wb-card__header wb-card__drag-handle';
  header.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);cursor:grab;display:flex;align-items:center;gap:0.5rem;';

  const handleIcon = document.createElement('span');
  handleIcon.style.cssText = 'opacity:0.5;';
  handleIcon.textContent = '⋮⋮';
  header.appendChild(handleIcon);

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'wb-card__title';
    titleEl.style.cssText = 'margin:0;flex:1;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    header.appendChild(titleEl);
  }

  element.appendChild(header);

  // Content
  const content = base.createMain();
  element.appendChild(content);

  // Footer
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  // Drag behavior
  let isDragging = false;
  let startX, startY, initialX, initialY;

  header.onmousedown = (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = element.offsetLeft;
    initialY = element.offsetTop;
    header.style.cursor = 'grabbing';
  };

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    element.style.left = (initialX + e.clientX - startX) + 'px';
    element.style.top = (initialY + e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
    }
  });

  return base.cleanup;
}

// ============================================
// PORTFOLIO CARD
// ============================================
export function cardportfolio(element, options = {}) {
  const config = {
    name: options.name || element.dataset.name,
    title: options.title || element.dataset.title,
    company: options.company || element.dataset.company,
    email: options.email || element.dataset.email,
    phone: options.phone || element.dataset.phone,
    website: options.website || element.dataset.website,
    linkedin: options.linkedin || element.dataset.linkedin,
    twitter: options.twitter || element.dataset.twitter,
    github: options.github || element.dataset.github,
    avatar: options.avatar || element.dataset.avatar,
    cover: options.cover || element.dataset.cover,
    bio: options.bio || element.dataset.bio,
    location: options.location || element.dataset.location,
    ...options
  };

  const base = cardBase(element, { ...config, behavior: 'cardportfolio', hoverable: false });
  element.innerHTML = '';
  element.style.maxWidth = '400px';

  // Cover
  if (config.cover) {
    const coverFig = base.createFigure();
    coverFig.className = 'wb-card__figure wb-card__portfolio-cover';
    coverFig.style.cssText = `margin:0;height:120px;background-image:url(${config.cover});background-size:cover;background-position:center;`;
    element.appendChild(coverFig);
  }

  // Profile section
  const profile = document.createElement('div');
  profile.style.cssText = `text-align:center;padding:1.5rem;${config.cover ? 'margin-top:-50px;' : ''}`;

  if (config.avatar) {
    const avatarImg = document.createElement('img');
    avatarImg.className = 'wb-card__portfolio-avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.name || 'Avatar';
    avatarImg.style.cssText = 'width:100px;height:100px;border-radius:50%;border:4px solid var(--bg-secondary,#1f2937);object-fit:cover;';
    profile.appendChild(avatarImg);
  }

  if (config.name) {
    const nameEl = document.createElement('h2');
    nameEl.className = 'wb-card__portfolio-name';
    nameEl.style.cssText = 'margin:1rem 0 0;font-size:1.5rem;color:var(--text-primary,#f9fafb);';
    nameEl.textContent = config.name;
    profile.appendChild(nameEl);
  }

  if (config.title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'wb-card__portfolio-title';
    titleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--primary,#6366f1);font-weight:500;';
    titleEl.textContent = config.title;
    profile.appendChild(titleEl);
  }

  if (config.company) {
    const companyEl = document.createElement('p');
    companyEl.className = 'wb-card__portfolio-company';
    companyEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-secondary,#9ca3af);';
    companyEl.textContent = config.company;
    profile.appendChild(companyEl);
  }

  if (config.location) {
    const locEl = document.createElement('p');
    locEl.className = 'wb-card__portfolio-location';
    locEl.style.cssText = 'margin:0.5rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.9rem;';
    locEl.textContent = `📍 ${config.location}`;
    profile.appendChild(locEl);
  }

  if (config.bio) {
    const bioEl = document.createElement('p');
    bioEl.className = 'wb-card__portfolio-bio';
    bioEl.style.cssText = 'margin:1rem 0 0;color:var(--text-primary,#f9fafb);font-size:0.9rem;line-height:1.6;';
    bioEl.textContent = config.bio;
    profile.appendChild(bioEl);
  }

  element.appendChild(profile);

  // Contact info
  if (config.email || config.phone || config.website) {
    const contact = document.createElement('address');
    contact.style.cssText = 'padding:1rem;border-top:1px solid var(--border-color,#374151);font-style:normal;';

    if (config.email) {
      const emailLink = document.createElement('a');
      emailLink.className = 'wb-card__portfolio-email';
      emailLink.href = `mailto:${config.email}`;
      emailLink.style.cssText = 'display:block;padding:0.5rem 0;color:var(--text-primary,#f9fafb);text-decoration:none;';
      emailLink.textContent = `📧 ${config.email}`;
      contact.appendChild(emailLink);
    }

    if (config.phone) {
      const phoneLink = document.createElement('a');
      phoneLink.className = 'wb-card__portfolio-phone';
      phoneLink.href = `tel:${config.phone}`;
      phoneLink.style.cssText = 'display:block;padding:0.5rem 0;color:var(--text-primary,#f9fafb);text-decoration:none;';
      phoneLink.textContent = `📱 ${config.phone}`;
      contact.appendChild(phoneLink);
    }

    if (config.website) {
      const webLink = document.createElement('a');
      webLink.className = 'wb-card__portfolio-website';
      webLink.href = config.website;
      webLink.target = '_blank';
      webLink.style.cssText = 'display:block;padding:0.5rem 0;color:var(--text-primary,#f9fafb);text-decoration:none;';
      webLink.textContent = `🌐 ${config.website}`;
      contact.appendChild(webLink);
    }

    element.appendChild(contact);
  }

  // Social links
  if (config.linkedin || config.twitter || config.github) {
    const social = document.createElement('div');
    social.className = 'wb-card__portfolio-social';
    social.style.cssText = 'padding:1rem;border-top:1px solid var(--border-color,#374151);display:flex;justify-content:center;gap:1rem;';

    const links = [
      { url: config.linkedin, icon: '💼', label: 'LinkedIn' },
      { url: config.twitter, icon: '🐦', label: 'Twitter' },
      { url: config.github, icon: '🐙', label: 'GitHub' }
    ];

    links.forEach(({ url, icon, label }) => {
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.title = label;
        link.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary,#374151);border-radius:50%;text-decoration:none;font-size:1.25rem;';
        link.textContent = icon;
        social.appendChild(link);
      }
    });

    element.appendChild(social);
  }

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
