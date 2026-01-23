/**
 * Builder Pages - Page management functions
 * 
 * Each page can have:
 * - showHeader: boolean (whether to include shared header from home)
 * - showFooter: boolean (whether to include shared footer from home)
 */

// Get current page
function getCurrentPage() {
  return pages.find(p => p.id === currentPageId);
}

// Get all components (global header/footer + current page main)
function getAllComponents() {
  const page = getCurrentPage();
  const result = [];
  
  // Include header if page wants it (or if it's home page)
  if (page?.id === 'home' || page?.showHeader) {
    result.push(...globalSections.header);
  }
  
  // Always include main content
  result.push(...components.filter(c => c.section === 'main'));
  
  // Include footer if page wants it (or if it's home page)
  if (page?.id === 'home' || page?.showFooter) {
    result.push(...globalSections.footer);
  }
  
  return result;
}

// Render pages list
function renderPagesList() {
  const pageOrder = ['home', 'about', 'contact'];
  const sortedPages = [...pages].sort((a, b) => {
    const aIndex = pageOrder.indexOf(a.id);
    const bIndex = pageOrder.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  const list = document.getElementById('pagesList');
  list.innerHTML = sortedPages.map(page => {
    // Show indicators for header/footer inclusion (before page name)
    const indicators = page.id !== 'home' ? `
      <span class="page-indicators" style="font-size: 0.7rem; opacity: 0.6;">
        ${page.showHeader ? '🔝' : ''}${page.showFooter ? '🔻' : ''}
      </span>
    ` : '';
    
    return `
      <div class="page-item ${page.id === currentPageId ? 'active' : ''}" onclick="switchToPage('${page.id}')">
        ${indicators}
        <span class="page-name" style="flex: 1;">${page.name}</span>
        ${page.id !== 'home' ? `<button class="page-delete-btn" onclick="deletePage('${page.id}', event)">×</button>` : ''}
      </div>
    `;
  }).join('');
}

// Switch to a different page
function switchToPage(pageId) {
  console.log('switchToPage called:', pageId);
  
  // Save current page's main content
  const currentPage = getCurrentPage();
  if (currentPage) {
    currentPage.main = components
      .filter(c => c.section === 'main')
      .map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  
  currentPageId = pageId;
  window.currentPageId = currentPageId;
  const newPage = getCurrentPage();
  
  // EXPOSE CURRENT PAGE GLOBALLY for navbar and preview mode
  window.currentPage = newPage ? {
    id: newPage.id,
    name: newPage.name,
    slug: newPage.slug
  } : null;
  
  // Dispatch event for navbar to update active state
  document.dispatchEvent(new CustomEvent('wb:page:changed', {
    detail: window.currentPage
  }));
  
  // Clear main container
  const mainContainer = document.getElementById('main-container');
  const mainDropZone = mainContainer.querySelector('.canvas-drop-zone');
  mainContainer.querySelectorAll('.canvas-component').forEach(el => el.remove());
  mainDropZone.classList.remove('has-items');
  
  // Remove main components from array
  components = components.filter(c => c.section !== 'main');
  window.components = components;
  
  // Clear selection
  selectedComponent = null;
  document.getElementById('propertiesPanel').innerHTML = 
    `<div class="properties-empty">Click a component to edit its properties</div>`;
  
  // Restore new page's main components
  if (newPage && newPage.main && newPage.main.length > 0) {
    newPage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) {
        restoreComponent(compData, template);
      }
    });
  }
  
  // Ensure drop zones are always last after restoring components
  if (typeof ensureAllDropZonesLast === 'function') {
    ensureAllDropZonesLast();
  }
  
  // Update UI
  renderPagesList();
  renderComponentLibrary();
  updateComponentCount();
  showPageProperties(newPage);
  updateActiveElement('page', newPage?.name || 'Unknown');
  updateCanvasSectionsVisibility(newPage);
  
  // Update canvas main section name and activate with green border
  if (window.updateMainSectionName) {
    window.updateMainSectionName(newPage?.name || '');
  }
  if (window.activateMainSection) {
    window.activateMainSection();
  }
}

// Add new page dialog
function addNewPage() {
  document.getElementById('newPageDialog')?.remove();
  
  const pageTemplates = [
    { id: 'blank', icon: '📋', name: 'Blank' },
    { id: 'services', icon: '⚙️', name: 'Services' },
    { id: 'contact', icon: '📞', name: 'Contact' },
    { id: 'about', icon: 'ℹ️', name: 'About' },
    { id: 'portfolio', icon: '🖼️', name: 'Portfolio' },
    { id: 'faq', icon: '❓', name: 'FAQ' }
  ];
  
  const dialog = document.createElement('div');
  dialog.id = 'newPageDialog';
  dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
  
  dialog.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; width: 450px; max-width: 90%;">
      <h3 style="margin: 0 0 1.5rem 0; font-size: 1.2rem;">📄 Add New Page</h3>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">Select Page Type</label>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
          ${pageTemplates.map((t, i) => `
            <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--bg-tertiary); border: 2px solid ${i === 0 ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="pageTemplate" value="${t.id}" name="${t.name}" ${i === 0 ? 'checked' : ''} style="accent-color: var(--primary);">
              <span>${t.icon} ${t.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">Page Name <span style="opacity: 0.6;">(optional)</span></label>
        <input type="text" id="newPageName" placeholder="Custom name..." style="width: 100%; padding: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 1rem;">
      </div>
      
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
        <label style="display: block; margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">Include from Home Page</label>
        <div style="display: flex; gap: 1.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="newPageShowHeader" checked style="accent-color: var(--primary);">
            <span>🔝 Header</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="newPageShowFooter" checked style="accent-color: var(--primary);">
            <span>🔻 Footer</span>
          </label>
        </div>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); opacity: 0.7;">
          Uses the header/footer you created on the Home page
        </p>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button onclick="document.getElementById('newPageDialog').remove()" class="btn btn-secondary">Cancel</button>
        <button onclick="createNewPage()" class="btn btn-primary">Create Page</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  document.getElementById('newPageName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createNewPage();
    if (e.key === 'Escape') dialog.remove();
  });
  
  dialog.querySelectorAll('input[name="pageTemplate"]').forEach(radio => {
    radio.addEventListener('change', () => {
      dialog.querySelectorAll('input[name="pageTemplate"]').forEach(r => {
        r.closest('label').style.borderColor = r.checked ? 'var(--primary)' : 'var(--border-color)';
      });
    });
  });
}

// Create the new page
function createNewPage() {
  const selectedRadio = document.querySelector('input[name="pageTemplate"]:checked');
  const template = selectedRadio?.value || 'blank';
  const templateName = selectedRadio?.dataset.name || 'Page';
  const customName = document.getElementById('newPageName').value.trim();
  const name = customName || templateName;
  
  // Get header/footer options
  const showHeader = document.getElementById('newPageShowHeader')?.checked ?? true;
  const showFooter = document.getElementById('newPageShowFooter')?.checked ?? true;
  
  if (template === 'blank' && !customName) {
    alert('Please enter a page name for blank pages');
    document.getElementById('newPageName').focus();
    return;
  }
  
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const slug = id + '.html';
  
  if (pages.find(p => p.id === id)) {
    alert(`A page named "${name}" already exists.`);
    return;
  }
  
  const newPage = { 
    id, 
    name, 
    slug, 
    main: [],
    showHeader,
    showFooter
  };
  
  // Add template content with proper descriptions and lorem text
  if (template === 'services') {
    newPage.main = [
      { 
        id: `comp-${id}-hero`, 
        type: 'hero', 
        section: 'main', 
        html: `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Our Services</h1>
          <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Discover our comprehensive range of professional services designed to help your business grow and succeed.</p>
        </div>`, 
        data: { title: 'Our Services', subtitle: 'Discover our comprehensive range of professional services designed to help your business grow and succeed.' } 
      },
      { 
        id: `comp-${id}-features`, 
        type: 'features', 
        section: 'main', 
        html: null, 
        data: { 
          title: 'What We Offer',
          cards: [
            { icon: '⚙️', title: 'Consulting', description: 'Expert guidance to help you navigate complex business challenges. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.' },
            { icon: '🛠️', title: 'Development', description: 'Custom solutions built to meet your specific needs. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.' },
            { icon: '🚀', title: 'Support', description: 'Dedicated assistance to keep your operations running smoothly. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.' },
            { icon: '📊', title: 'Analytics', description: 'driven insights to inform your business decisions. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.' }
          ], 
          selectedCard: 0 
        }
      },
      {
        id: `comp-${id}-cta`,
        type: 'cta',
        section: 'main',
        html: null,
        data: { 
          title: 'Ready to Get Started?', 
          description: 'Contact us today to discuss how our services can help transform your business. Our team is ready to create a customized solution for you.',
          buttonText: 'Request a Quote',
          buttonUrl: 'contact.html'
        }
      }
    ];
  } else if (template === 'contact') {
    newPage.main = [
      { 
        id: `comp-${id}-hero`, 
        type: 'hero', 
        section: 'main', 
        html: `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Contact Us</h1>
          <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">We'd love to hear from you. Reach out to our team and let's start a conversation about how we can help.</p>
        </div>`, 
        data: { title: 'Contact Us', subtitle: "We'd love to hear from you. Reach out to our team and let's start a conversation about how we can help." } 
      },
      { 
        id: `comp-${id}-cta-phone`, 
        type: 'cta', 
        section: 'main', 
        html: null, 
        data: { 
          contactType: 'phone', 
          phoneNumber: '(555) 123-4567', 
          title: 'Give Us a Call', 
          description: 'Our friendly team is available Monday through Friday, 9am to 5pm EST. We typically respond within one business day.' 
        }
      },
      { 
        id: `comp-${id}-cta-email`, 
        type: 'cta', 
        section: 'main', 
        html: null, 
        data: { 
          contactType: 'email', 
          email: 'hello@example.com', 
          title: 'Send Us an Email', 
          description: 'Prefer to write? Send us a detailed message and our team will get back to you within 24-48 hours with a personalized response.' 
        }
      },
      {
        id: `comp-${id}-faq`,
        type: 'faq',
        section: 'main',
        html: null,
        data: {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What are your business hours?', answer: 'We are open Monday through Friday, 9:00 AM to 5:00 PM Eastern Standard Time. We are closed on major holidays.' },
            { question: 'How quickly do you respond to inquiries?', answer: 'We strive to respond to all inquiries within 24-48 business hours. Urgent matters are typically addressed the same day.' },
            { question: 'Do you offer virtual consultations?', answer: 'Yes! We offer video consultations via Zoom or Google Meet at your convenience. Just mention your preference when you contact us.' }
          ]
        }
      }
    ];
  } else if (template === 'about') {
    newPage.main = [
      { 
        id: `comp-${id}-hero`, 
        type: 'hero', 
        section: 'main', 
        html: `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">About Us</h1>
          <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Learn more about our story, our mission, and the passionate team behind our success.</p>
        </div>`, 
        data: { title: 'About Us', subtitle: 'Learn more about our story, our mission, and the passionate team behind our success.' } 
      },
      {
        id: `comp-${id}-story`,
        type: 'features',
        section: 'main',
        html: null,
        data: {
          title: 'Our Story',
          cards: [
            { icon: '🎯', title: 'Our Mission', description: 'To deliver exceptional value and innovative solutions that empower our clients to achieve their goals. Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
            { icon: '👁️', title: 'Our Vision', description: 'To be the trusted partner of choice for businesses seeking transformative growth. Ut enim ad minim veniam, quis nostrud exercitation ullamco.' },
            { icon: '❤️', title: 'Our Values', description: 'Integrity, innovation, and excellence guide everything we do. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.' }
          ],
          selectedCard: 0
        }
      },
      { 
        id: `comp-${id}-team`, 
        type: 'team', 
        section: 'main', 
        html: null, 
        data: {
          title: 'Meet Our Team',
          subtitle: 'The talented individuals who make it all happen',
          members: [
            { name: 'Jane Smith', role: 'CEO & Founder', bio: 'With over 15 years of industry experience, Jane leads our company with vision and passion.' },
            { name: 'John Doe', role: 'CTO', bio: 'John brings technical expertise and innovative thinking to every project we undertake.' },
            { name: 'Sarah Johnson', role: 'Design Director', bio: 'Sarah\'s creative vision ensures our work always exceeds client expectations.' },
            { name: 'Mike Wilson', role: 'Operations Manager', bio: 'Mike keeps everything running smoothly behind the scenes.' }
          ]
        } 
      },
      {
        id: `comp-${id}-testimonials`,
        type: 'testimonials',
        section: 'main',
        html: null,
        data: {
          title: 'What Our Clients Say',
          testimonials: [
            { quote: 'Working with this team has been an absolute pleasure. They delivered beyond our expectations and truly understood our vision.', author: 'Emily R.', company: 'Tech Startup Inc.' },
            { quote: 'Professional, responsive, and incredibly talented. I would recommend them to anyone looking for quality work.', author: 'David M.', company: 'Marketing Solutions' }
          ]
        }
      }
    ];
  } else if (template === 'portfolio') {
    newPage.main = [
      { 
        id: `comp-${id}-hero`, 
        type: 'hero', 
        section: 'main', 
        html: `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Our Portfolio</h1>
          <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Explore our collection of successful projects and see the quality of work we deliver for our clients.</p>
        </div>`, 
        data: { title: 'Our Portfolio', subtitle: 'Explore our collection of successful projects and see the quality of work we deliver for our clients.' } 
      },
      {
        id: `comp-${id}-intro`,
        type: 'features',
        section: 'main',
        html: null,
        data: {
          title: 'Project Categories',
          cards: [
            { icon: '🎨', title: 'Design', description: 'Beautiful, user-centered designs that captivate and convert. From branding to UI/UX, we create visual experiences that resonate.' },
            { icon: '💻', title: 'Development', description: 'Robust, scalable applications built with modern technologies. We bring your digital vision to life with clean, efficient code.' },
            { icon: '📈', title: 'Marketing', description: 'Strategic campaigns that drive results. We help brands reach their target audience and achieve measurable growth.' }
          ],
          selectedCard: 0
        }
      },
      { 
        id: `comp-${id}-gallery`, 
        type: 'gallery', 
        section: 'main', 
        html: null, 
        data: {
          title: 'Featured Work',
          subtitle: 'A selection of our recent projects',
          items: [
            { title: 'E-Commerce Platform', category: 'Development', description: 'A fully-featured online store with inventory management and payment processing.' },
            { title: 'Brand Identity', category: 'Design', description: 'Complete brand overhaul including logo, color palette, and style guidelines.' },
            { title: 'Mobile App', category: 'Development', description: 'Cross-platform mobile application with real-time features and offline support.' },
            { title: 'Marketing Campaign', category: 'Marketing', description: 'Multi-channel campaign that increased client revenue by 150% in 6 months.' },
            { title: 'Corporate Website', category: 'Design', description: 'Modern, responsive website showcasing company services and expertise.' },
            { title: 'SaaS Dashboard', category: 'Development', description: 'Data visualization platform with custom charts and real-time analytics.' }
          ]
        } 
      },
      {
        id: `comp-${id}-cta`,
        type: 'cta',
        section: 'main',
        html: null,
        data: { 
          title: 'Have a Project in Mind?', 
          description: 'We\'d love to hear about your next project. Let\'s work together to create something amazing.',
          buttonText: 'Start a Project',
          buttonUrl: 'contact.html'
        }
      }
    ];
  } else if (template === 'faq') {
    newPage.main = [
      { 
        id: `comp-${id}-hero`, 
        type: 'hero', 
        section: 'main', 
        html: `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Frequently Asked Questions</h1>
          <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Find answers to common questions about our products, services, and policies.</p>
        </div>`, 
        data: { title: 'Frequently Asked Questions', subtitle: 'Find answers to common questions about our products, services, and policies.' } 
      },
      { 
        id: `comp-${id}-faq-general`, 
        type: 'faq', 
        section: 'main', 
        html: null, 
        data: {
          title: 'General Questions',
          items: [
            { question: 'What services do you offer?', answer: 'We offer a comprehensive range of services including web design, development, digital marketing, and consulting. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
            { question: 'How long have you been in business?', answer: 'We have been proudly serving clients for over 10 years. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' },
            { question: 'Do you work with clients internationally?', answer: 'Yes! We work with clients from around the world. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
            { question: 'What industries do you specialize in?', answer: 'We have experience across many industries including technology, healthcare, finance, retail, and education. Excepteur sint occaecat cupidatat non proident.' }
          ]
        } 
      },
      { 
        id: `comp-${id}-faq-pricing`, 
        type: 'faq', 
        section: 'main', 
        html: null, 
        data: {
          title: 'Pricing & Payments',
          items: [
            { question: 'How do you structure your pricing?', answer: 'We offer both project-based and retainer pricing models depending on your needs. Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
            { question: 'Do you require a deposit?', answer: 'Yes, we typically require a 50% deposit to begin work, with the balance due upon completion. Ut enim ad minim veniam, quis nostrud exercitation.' },
            { question: 'What payment methods do you accept?', answer: 'We accept credit cards, bank transfers, and PayPal for your convenience. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.' },
            { question: 'Do you offer payment plans?', answer: 'For larger projects, we can arrange milestone-based payment schedules. Please contact us to discuss your specific needs.' }
          ]
        } 
      },
      {
        id: `comp-${id}-cta`,
        type: 'cta',
        section: 'main',
        html: null,
        data: { 
          title: 'Still Have Questions?', 
          description: 'Can\'t find the answer you\'re looking for? Our team is here to help. Reach out and we\'ll get back to you as soon as possible.',
          buttonText: 'Contact Us',
          buttonUrl: 'contact.html'
        }
      }
    ];
  }
  
  pages.push(newPage);
  window.pages = pages;
  document.getElementById('newPageDialog').remove();
  switchToPage(id);
  updateNavbarLinks();
}

// Delete page
function deletePage(pageId, event) {
  event.stopPropagation();
  if (pages.length <= 1) { alert('Cannot delete the last page'); return; }
  
  const page = pages.find(p => p.id === pageId);
  if (!confirm(`Delete "${page.name}" page?`)) return;
  
  pages = pages.filter(p => p.id !== pageId);
  window.pages = pages;
  if (currentPageId === pageId) switchToPage(pages[0].id);
  else renderPagesList();
  
  updateNavbarLinks();
}

// Update navbar links
function updateNavbarLinks() {
  components.forEach(comp => {
    if (comp.type === 'navbar') {
      const links = pages.slice(0, 4).map(p => 
        `<a href="${p.slug}" style="color: var(--text-secondary); text-decoration: none;">${p.name}</a>`
      ).join('');
      const logoText = comp.data?.logo || 'Logo';
      comp.html = `<div style="display: flex; gap: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; align-items: center;">
        <span style="font-weight: 700;">${logoText}</span>
        ${links}
      </div>`;
      comp.element.querySelector('.component-content').innerHTML = comp.html;
    }
  });
}

// Create navbar pages (with header/footer enabled by default)
function createNavbarPages() {
  const navPages = [
    { id: 'home', name: 'Home', slug: 'index.html' },
    { id: 'about', name: 'About', slug: 'about.html', showHeader: true, showFooter: true },
    { id: 'contact', name: 'Contact', slug: 'contact.html', showHeader: true, showFooter: true }
  ];
  
  let created = [];
  navPages.forEach(np => {
    if (!pages.find(p => p.id === np.id)) {
      pages.push({ 
        id: np.id, 
        name: np.name, 
        slug: np.slug, 
        main: [],
        showHeader: np.showHeader ?? false,
        showFooter: np.showFooter ?? false
      });
      created.push(np.name);
    }
  });
  
  if (created.length > 0) {
    renderPagesList();
    updateNavbarLinks();
  }
}

// Show page properties
function showPageProperties(page) {
  if (!page) return;
  const panel = document.getElementById('propertiesPanel');
  
  const isHome = page.id === 'home';
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>📄 Page Properties</h4>
      
      <div class="property">
        <label>Page Name</label>
        <input type="text" value="${page.name}" 
          ${isHome ? 'disabled title="Home page cannot be renamed"' : ''}
          onchange="updatePageProperty('${page.id}', 'name', this.value)">
      </div>
      
      <div class="property">
        <label>URL Slug</label>
        <input type="text" value="${page.slug}" 
          ${isHome ? 'disabled title="Home page slug cannot be changed"' : ''}
          onchange="updatePageProperty('${page.id}', 'slug', this.value)">
      </div>
      
      ${!isHome ? `
        <div class="property" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <label style="margin-bottom: 0.75rem; display: block;">Include from Home Page</label>
          
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem 0.75rem; background: var(--bg-tertiary); border-radius: 6px;" title="Include navigation from Home page">
              <input type="checkbox" ${page.showHeader ? 'checked' : ''} 
                onchange="updatePageProperty('${page.id}', 'showHeader', this.checked)"
                style="accent-color: var(--primary); width: 18px; height: 18px;">
              <span style="font-weight: 600;">🔝 Show Header</span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem 0.75rem; background: var(--bg-tertiary); border-radius: 6px;" title="Include footer from Home page">
              <input type="checkbox" ${page.showFooter ? 'checked' : ''} 
                onchange="updatePageProperty('${page.id}', 'showFooter', this.checked)"
                style="accent-color: var(--primary); width: 18px; height: 18px;">
              <span style="font-weight: 600;">🔻 Show Footer</span>
            </label>
          </div>
        </div>
      ` : `
        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px;">
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
            <strong>💡 Home Page</strong><br>
            Header and footer created here will be available to all other pages.
          </p>
        </div>
      `}
      
      <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 1rem;">
        💡 Click on a component to edit its properties.
      </p>
    </div>
  `;
}

// Update page property
function updatePageProperty(pageId, property, value) {
  const page = pages.find(p => p.id === pageId);
  if (!page) return;
  
  // Protect home page
  if (pageId === 'home' && (property === 'name' || property === 'slug')) {
    return;
  }
  
  page[property] = value;
  
  if (property === 'slug') updateNavbarLinks();
  if (property === 'showHeader' || property === 'showFooter') {
    updateCanvasSectionsVisibility(page);
  }
  
  renderPagesList();
  showPageProperties(page);
}

// Update canvas sections visibility based on current page settings
function updateCanvasSectionsVisibility(page) {
  const headerSection = document.querySelector('.canvas-section.header');
  const footerSection = document.querySelector('.canvas-section.footer');
  
  // Exit early if elements don't exist yet
  if (!headerSection || !footerSection) {
    console.warn('[Builder] Canvas sections not found, skipping visibility update');
    return;
  }
  
  if (!page) page = getCurrentPage();
  const isHome = page?.id === 'home';
  
  // Remove any badges from previous state
  headerSection.querySelector('.section-from-home-badge')?.remove();
  footerSection.querySelector('.section-from-home-badge')?.remove();
  
  if (isHome) {
    // Home page: show header/footer sections fully (editable)
    headerSection.style.display = 'block';
    headerSection.style.opacity = '1';
    headerSection.classList.remove('readonly-section');
    
    footerSection.style.display = 'block';
    footerSection.style.opacity = '1';
    footerSection.classList.remove('readonly-section');
    
    console.log('[Builder] Home page - showing header/footer sections');
  } else {
    // Non-home page: show/hide based on page settings
    if (page?.showHeader) {
      headerSection.style.display = 'block';
      headerSection.style.opacity = '0.7';
      headerSection.classList.add('readonly-section');
      // Add visual indicator that it's from home
      if (!headerSection.querySelector('.section-from-home-badge')) {
        const badge = document.createElement('div');
        badge.className = 'section-from-home-badge';
        badge.innerHTML = '📌 From Home';
        badge.style.cssText = 'position: absolute; top: 4px; right: 4px; font-size: 0.7rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; z-index: 10;';
        headerSection.style.position = 'relative';
        headerSection.appendChild(badge);
      }
    } else {
      headerSection.style.display = 'none';
    }
    
    if (page?.showFooter) {
      footerSection.style.display = 'block';
      footerSection.style.opacity = '0.7';
      footerSection.classList.add('readonly-section');
      // Add visual indicator that it's from home
      if (!footerSection.querySelector('.section-from-home-badge')) {
        const badge = document.createElement('div');
        badge.className = 'section-from-home-badge';
        badge.innerHTML = '📌 From Home';
        badge.style.cssText = 'position: absolute; top: 4px; right: 4px; font-size: 0.7rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; z-index: 10;';
        footerSection.style.position = 'relative';
        footerSection.appendChild(badge);
      }
    } else {
      footerSection.style.display = 'none';
    }
  }
}

// Expose functions to window for external access and testing
window.createNavbarPages = createNavbarPages;
window.addNewPage = addNewPage;
window.createNewPage = createNewPage;
window.deletePage = deletePage;
window.switchToPage = switchToPage;
window.updateNavbarLinks = updateNavbarLinks;
window.showPageProperties = showPageProperties;
window.updatePageProperty = updatePageProperty;
window.updateCanvasSectionsVisibility = updateCanvasSectionsVisibility;
window.renderPagesList = renderPagesList;
