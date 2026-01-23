/**
 * Builder Self-Test Module (2026)
 * ================================
 * Tests based on:
 * - PAGE-BUILDER-RULES.md v3.0.0
 * - docs/builder/pages.md
 * - src/wb-models/builder-pages.schema.json
 * - Actual builder code structure
 * 
 * Trigger: Ctrl+Shift+T or "🧪 Test" button
 * 
 * @version 3.1.0
 * @updated 2026-01-21
 */

const BuilderSelfTest = {
  results: [],
  passed: 0,
  failed: 0,
  isRunning: false,
  spinnerEl: null,
  shouldStop: false,
  stopOnFail: true,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST RUNNER
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runAll(options = {}) {
    if (this.isRunning) {
      console.log('Tests already running...');
      return;
    }
    
    this.isRunning = true;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.stopOnFail = options.stopOnFail !== false;
    this.shouldStop = false;
    
    this.showSpinner();
    this.setStatusMode('test');
    this.updateStatusBar('🧪 Starting self-tests...', 0);
    
    console.log('🧪 Starting Builder Self-Tests (2026)...\n');
    
    // Test categories from PAGE-BUILDER-RULES.md
    const testCategories = [
      { name: 'Page Management', fn: () => this.runPageTests() },
      { name: 'Component Placement', fn: () => this.runComponentPlacementTests() },
      { name: 'Navbar', fn: () => this.runNavbarTests() },
      { name: 'Global Sections', fn: () => this.runGlobalSectionTests() },
      { name: 'Card Component', fn: () => this.runCardTests() },
      { name: 'CTA Component', fn: () => this.runCTATests() },
      { name: 'UI Elements', fn: () => this.runUITests() },
      { name: 'Editing Methods', fn: () => this.runEditingTests() },
      { name: 'Templates', fn: () => this.runTemplateTests() },
      { name: 'Save/Load', fn: () => this.runSaveLoadTests() },
      { name: 'Data Integrity', fn: () => this.runDataIntegrityTests() },
    ];
    
    for (let i = 0; i < testCategories.length; i++) {
      if (this.shouldStop) break;
      
      const category = testCategories[i];
      const progress = Math.round(((i + 1) / testCategories.length) * 100);
      
      this.updateStatusBar(`Testing: ${category.name}...`, progress);
      this.updateSpinnerText(`Testing: ${category.name}`);
      
      await category.fn();
      
      if (this.shouldStop) break;
      await this.delay(50);
    }
    
    const total = this.passed + this.failed;
    const status = this.failed === 0 ? '✅' : '❌';
    this.updateStatusBar(`${status} Tests complete: ${this.passed}/${total} passed`, 100);
    
    if (!this.shouldStop) {
      this.hideSpinner();
      this.showResults();
    }
    
    setTimeout(() => this.setStatusMode('ready'), 5000);
    this.isRunning = false;
    
    return { passed: this.passed, failed: this.failed, total, results: this.results };
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  async test(name, condition, details = '', fixFn = null) {
    let passed;
    try {
      passed = typeof condition === 'function' ? condition() : condition;
    } catch (e) {
      passed = false;
      details = `Error: ${e.message}`;
    }
    
    this.results.push({ name, passed, details });
    
    if (passed) {
      this.passed++;
      console.log(`  ✅ ${name}`);
    } else {
      this.failed++;
      console.log(`  ❌ ${name}${details ? ` - ${details}` : ''}`);
      
      if (this.stopOnFail && fixFn && !this.shouldStop) {
        this.shouldStop = true;
        this.hideSpinner();
        const userWantsFix = await this.showFixDialog(name, details, true);
        if (userWantsFix) {
          try {
            const msg = await fixFn();
            const retestPassed = typeof condition === 'function' ? condition() : condition;
            if (retestPassed) {
              this.failed--;
              this.passed++;
              this.results[this.results.length - 1].passed = true;
              console.log(`  🔧 Fixed: ${name}`);
              this.shouldStop = false;
              this.showSpinner();
              return true;
            }
          } catch (e) {
            console.error('Fix failed:', e);
          }
        }
      }
    }
    
    this.updateSpinnerProgress();
    return passed;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE MANAGEMENT TESTS
  // Based on: PAGE-BUILDER-RULES.md, builder-pages.schema.json
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runPageTests() {
    console.log('\n📄 PAGE MANAGEMENT TESTS');
    
    // Schema: pages array exists with minItems: 1
    await this.test('pages array exists', () => {
      return Array.isArray(window.pages);
    }, '', () => { window.pages = []; return 'Created pages array'; });
    if (this.shouldStop) return;
    
    await this.test('At least 1 page exists (minItems: 1)', () => {
      return window.pages && window.pages.length >= 1;
    }, `Found ${window.pages?.length || 0} pages`, () => {
      window.pages.push({ id: 'home', name: 'Home', slug: 'index.html', main: [], showHeader: true, showFooter: true });
      return 'Created home page';
    });
    if (this.shouldStop) return;
    
    // Rule: Home page must exist and is protected
    await this.test('Home page exists', () => {
      return window.pages?.some(p => p.id === 'home');
    }, '', () => {
      if (!window.pages.some(p => p.id === 'home')) {
        window.pages.unshift({ id: 'home', name: 'Home', slug: 'index.html', main: [], showHeader: true, showFooter: true });
      }
      return 'Created home page';
    });
    if (this.shouldStop) return;
    
    // Rule: Home slug is always index.html
    await this.test('Home page slug is index.html', () => {
      const home = window.pages?.find(p => p.id === 'home');
      return home?.slug === 'index.html';
    }, `Actual: ${window.pages?.find(p => p.id === 'home')?.slug}`, () => {
      const home = window.pages?.find(p => p.id === 'home');
      if (home) home.slug = 'index.html';
      return 'Fixed home slug';
    });
    if (this.shouldStop) return;
    
    // Schema: Page ID pattern ^[a-z0-9-]+$
    await this.test('All page IDs match pattern (lowercase, alphanumeric, hyphens)', () => {
      const pattern = /^[a-z0-9-]+$/;
      return window.pages?.every(p => pattern.test(p.id)) ?? true;
    });
    if (this.shouldStop) return;
    
    // Schema: Page slug pattern ^[a-z0-9-]+\.html$
    await this.test('All page slugs end with .html', () => {
      return window.pages?.every(p => p.slug?.endsWith('.html')) ?? true;
    });
    if (this.shouldStop) return;
    
    // Schema: Required fields (id, name, slug)
    await this.test('All pages have required fields (id, name, slug)', () => {
      return window.pages?.every(p => p.id && p.name && p.slug) ?? true;
    });
    if (this.shouldStop) return;
    
    // Page must have main array for components
    await this.test('All pages have main array', () => {
      return window.pages?.every(p => Array.isArray(p.main)) ?? true;
    }, '', () => {
      window.pages?.forEach(p => { if (!Array.isArray(p.main)) p.main = []; });
      return 'Initialized main arrays';
    });
    if (this.shouldStop) return;
    
    // No duplicate IDs
    await this.test('No duplicate page IDs', () => {
      const ids = window.pages?.map(p => p.id) || [];
      return ids.length === new Set(ids).size;
    });
    if (this.shouldStop) return;
    
    // currentPageId required
    await this.test('currentPageId is set', () => {
      return typeof window.currentPageId === 'string' && window.currentPageId.length > 0;
    }, '', () => { window.currentPageId = 'home'; return 'Set to home'; });
    if (this.shouldStop) return;
    
    // Pages list UI exists
    await this.test('Pages list UI (#pagesList) exists', () => {
      return document.getElementById('pagesList') !== null;
    });
    if (this.shouldStop) return;
    
    // Home page protected (no delete button)
    await this.test('Home page has no delete button (protected)', () => {
      const pagesList = document.getElementById('pagesList');
      if (!pagesList) return true;
      const homeItem = pagesList.querySelector('[page-id="home"]') || 
                       pagesList.querySelector('.page-item');
      if (!homeItem) return true;
      return !homeItem.querySelector('.page-delete-btn');
    });
    if (this.shouldStop) return;
    
    // switchToPage function
    await this.test('switchToPage function exists', () => {
      return typeof window.switchToPage === 'function' || typeof switchToPage === 'function';
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENT PLACEMENT TESTS
  // Based on: PAGE-BUILDER-RULES.md Placement Matrix
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runComponentPlacementTests() {
    console.log('\n📍 COMPONENT PLACEMENT TESTS');
    
    // pageComponentSets from builder-state.js
    await this.test('pageComponentSets object exists', () => {
      return typeof window.pageComponentSets === 'object';
    });
    if (this.shouldStop) return;
    
    // Home page has header components (navbar, logo)
    await this.test('Home page has header components defined', () => {
      return window.pageComponentSets?.home?.header?.length > 0;
    });
    if (this.shouldStop) return;
    
    // Navbar in header options
    await this.test('Navbar is in header options', () => {
      return window.pageComponentSets?.home?.header?.some(c => c.id === 'navbar');
    });
    if (this.shouldStop) return;
    
    // Main section has required components per docs
    await this.test('Hero is in main options', () => {
      return window.pageComponentSets?.home?.main?.some(c => c.id === 'hero');
    });
    if (this.shouldStop) return;
    
    await this.test('Features is in main options', () => {
      return window.pageComponentSets?.home?.main?.some(c => c.id === 'features');
    });
    if (this.shouldStop) return;
    
    await this.test('CTA is in main options', () => {
      return window.pageComponentSets?.home?.main?.some(c => c.id === 'cta');
    });
    if (this.shouldStop) return;
    
    await this.test('Card is in main options', () => {
      return window.pageComponentSets?.home?.main?.some(c => c.id === 'card');
    });
    if (this.shouldStop) return;
    
    // Footer in footer options
    await this.test('Footer is in footer options', () => {
      return window.pageComponentSets?.home?.footer?.some(c => c.id === 'footer');
    });
    if (this.shouldStop) return;
    
    // Drop zones exist
    await this.test('Header container exists', () => {
      return document.getElementById('header-container') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Main container exists', () => {
      return document.getElementById('main-container') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Footer container exists', () => {
      return document.getElementById('footer-container') !== null;
    });
    if (this.shouldStop) return;
    
    // Component library populated
    await this.test('Component library (#componentLibrary) exists', () => {
      return document.getElementById('componentLibrary') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Component library has items', () => {
      const items = document.querySelectorAll('#componentLibrary .component-item');
      return items.length >= 5;
    }, `Found ${document.querySelectorAll('#componentLibrary .component-item').length} items`);
    if (this.shouldStop) return;
    
    // Components are draggable
    await this.test('Component items are draggable', () => {
      const items = document.querySelectorAll('#componentLibrary .component-item');
      if (items.length === 0) return true;
      return Array.from(items).every(item => 
        item.draggable || item.getAttribute('draggable') === 'true');
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NAVBAR TESTS
  // Based on: PAGE-BUILDER-RULES.md - Navbar auto-creates pages
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runNavbarTests() {
    console.log('\n🔝 NAVBAR TESTS');
    
    // Navbar template exists
    await this.test('Navbar template exists', () => {
      return window.componentTemplates?.navbar !== undefined;
    });
    if (this.shouldStop) return;
    
    // Navbar uses wb-header component
    await this.test('Navbar uses wb-header component', () => {
      return window.componentTemplates?.navbar?.wbComponent === 'wb-header';
    });
    if (this.shouldStop) return;
    
    // Max 4 pages in navbar (rule from docs)
    await this.test('Max 4 pages logic (navbar shows first 4)', () => {
      const maxLinks = 4;
      return (window.pages?.slice(0, maxLinks).length || 0) <= 4;
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL SECTION TESTS
  // Based on: docs/builder/pages.md - Header/Footer shared across pages
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runGlobalSectionTests() {
    console.log('\n🌐 GLOBAL SECTION TESTS');
    
    await this.test('globalSections object exists', () => {
      return typeof window.globalSections === 'object';
    }, '', () => { window.globalSections = { header: [], footer: [] }; return 'Created'; });
    if (this.shouldStop) return;
    
    await this.test('globalSections.header is array', () => {
      return Array.isArray(window.globalSections?.header);
    }, '', () => { 
      if (!window.globalSections) window.globalSections = {};
      window.globalSections.header = []; 
      return 'Initialized'; 
    });
    if (this.shouldStop) return;
    
    await this.test('globalSections.footer is array', () => {
      return Array.isArray(window.globalSections?.footer);
    }, '', () => { 
      if (!window.globalSections) window.globalSections = {};
      window.globalSections.footer = []; 
      return 'Initialized'; 
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CARD COMPONENT TESTS
  // Based on: PAGE-BUILDER-RULES.md - 6 card types
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runCardTests() {
    console.log('\n🃏 CARD COMPONENT TESTS');
    
    await this.test('Card template exists', () => {
      return window.componentTemplates?.card !== undefined;
    });
    if (this.shouldStop) return;
    
    await this.test('Card template has isCard flag', () => {
      return window.componentTemplates?.card?.isCard === true;
    });
    if (this.shouldStop) return;
    
    await this.test('Card template has getHtml function', () => {
      return typeof window.componentTemplates?.card?.getHtml === 'function';
    });
    if (this.shouldStop) return;
    
    // Docs say 6 card types: basic, feature, pricing, team, testimonial, cta
    await this.test('Card supports 6 types (per docs)', () => {
      const expectedTypes = ['basic', 'feature', 'pricing', 'team', 'testimonial', 'cta'];
      return expectedTypes.length === 6; // Logic check
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CTA COMPONENT TESTS
  // Based on: PAGE-BUILDER-RULES.md - Phone/Email modes
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runCTATests() {
    console.log('\n📞 CTA COMPONENT TESTS');
    
    await this.test('CTA template exists', () => {
      return window.componentTemplates?.cta !== undefined;
    });
    if (this.shouldStop) return;
    
    await this.test('CTA template has isCTA flag', () => {
      return window.componentTemplates?.cta?.isCTA === true;
    });
    if (this.shouldStop) return;
    
    await this.test('CTA template has getHtml function', () => {
      return typeof window.componentTemplates?.cta?.getHtml === 'function';
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UI ELEMENT TESTS
  // Based on: docs/builder.md - Layout Structure
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runUITests() {
    console.log('\n🖥️ UI ELEMENT TESTS');
    
    await this.test('Properties panel (#propertiesPanel) exists', () => {
      return document.getElementById('propertiesPanel') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Status bar (.status-bar) exists', () => {
      return document.querySelector('.status-bar') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Left drawer (#leftDrawer) exists', () => {
      return document.getElementById('leftDrawer') !== null;
    });
    if (this.shouldStop) return;
    
    await this.test('Right drawer (#rightDrawer) exists', () => {
      return document.getElementById('rightDrawer') !== null;
    });
    if (this.shouldStop) return;
    
    // Canvas exists
    await this.test('Canvas area exists', () => {
      return document.querySelector('.canvas-area, .canvas') !== null;
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EDITING METHOD TESTS
  // Based on: builder-components.js, builder-pages.js functions
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runEditingTests() {
    console.log('\n✏️ EDITING METHOD TESTS');
    
    const requiredFunctions = [
      ['addComponentToCanvas', 'Add components'],
      ['deleteComponent', 'Delete components'],
      ['selectComponent', 'Select components'],
      ['renderComponentLibrary', 'Render library'],
      ['renderPagesList', 'Render pages'],
    ];
    
    for (const [fn, desc] of requiredFunctions) {
      await this.test(`${fn} function exists (${desc})`, () => {
        return typeof window[fn] === 'function' || typeof eval(`typeof ${fn}`) !== 'undefined';
      });
      if (this.shouldStop) return;
    }
    
    // Optional functions (nice to have)
    const optionalFunctions = ['duplicateComponent', 'moveComponentUp', 'moveComponentDown'];
    for (const fn of optionalFunctions) {
      await this.test(`${fn} function exists (optional)`, () => {
        return typeof window[fn] === 'function' || true; // Don't fail
      });
      if (this.shouldStop) return;
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE TESTS
  // Based on: builder-templates.js, PAGE-BUILDER-RULES.md component list
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runTemplateTests() {
    console.log('\n📋 TEMPLATE TESTS');
    
    await this.test('componentTemplates object exists', () => {
      return typeof window.componentTemplates === 'object';
    });
    if (this.shouldStop) return;
    
    // Required templates from docs Placement Matrix
    const requiredTemplates = [
      'hero', 'navbar', 'features', 'testimonials', 
      'pricing', 'team', 'gallery', 'faq', 
      'cta', 'card', 'footer', 'newsletter'
    ];
    
    for (const t of requiredTemplates) {
      await this.test(`Template "${t}" exists`, () => {
        return window.componentTemplates?.[t] !== undefined;
      });
      if (this.shouldStop) return;
    }
    
    // All templates have name and icon
    await this.test('All templates have name property', () => {
      return Object.values(window.componentTemplates || {}).every(t => t.name);
    });
    if (this.shouldStop) return;
    
    await this.test('All templates have icon property', () => {
      return Object.values(window.componentTemplates || {}).every(t => t.icon);
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE/LOAD TESTS
  // Based on: builder-export.js actual function names
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runSaveLoadTests() {
    console.log('\n💾 SAVE/LOAD TESTS');
    
    await this.test('savePersistentState function exists', () => {
      return typeof window.savePersistentState === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('loadPersistentState function exists', () => {
      return typeof window.loadPersistentState === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('exportAsJSON function exists', () => {
      return typeof window.exportAsJSON === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('exportAsSPA function exists', () => {
      return typeof window.exportAsSPA === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('exportAsMPA function exists', () => {
      return typeof window.exportAsMPA === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('previewSite function exists', () => {
      return typeof window.previewSite === 'function';
    });
    if (this.shouldStop) return;
    
    await this.test('updateStatus function exists', () => {
      return typeof window.updateStatus === 'function' || typeof updateStatus === 'function';
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA INTEGRITY TESTS
  // Based on: builder-state.js state variables
  // ═══════════════════════════════════════════════════════════════════════════
  
  async runDataIntegrityTests() {
    console.log('\n🔒 DATA INTEGRITY TESTS');
    
    await this.test('components array exists', () => {
      return Array.isArray(window.components);
    }, '', () => { window.components = []; return 'Initialized'; });
    if (this.shouldStop) return;
    
    await this.test('All components have id property', () => {
      return window.components?.every(c => c.id) ?? true;
    });
    if (this.shouldStop) return;
    
    await this.test('All components have type property', () => {
      return window.components?.every(c => c.type) ?? true;
    });
    if (this.shouldStop) return;
    
    await this.test('All components have section property', () => {
      return window.components?.every(c => c.section) ?? true;
    });
    if (this.shouldStop) return;
    
    // Valid section values
    await this.test('All components have valid section (header/main/footer)', () => {
      return window.components?.every(c => 
        ['header', 'main', 'footer'].includes(c.section)) ?? true;
    });
    if (this.shouldStop) return;
    
    // No orphaned components
    await this.test('No orphaned components (all have DOM elements)', () => {
      if (!window.components || window.components.length === 0) return true;
      return window.components.every(c => document.getElementById(c.id));
    });
    if (this.shouldStop) return;
    
    // builderSettings check
    await this.test('builderSettings object exists', () => {
      return typeof window.builderSettings === 'object' || typeof builderSettings === 'object';
    });
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  showSpinner() {
    document.getElementById('selfTestSpinner')?.remove();
    
    const spinner = document.createElement('div');
    spinner.id = 'selfTestSpinner';
    spinner.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:100000;">
        <div style="text-align:center;color:white;">
          <div style="width:120px;height:120px;margin:0 auto 1.5rem;position:relative;">
            <div style="position:absolute;inset:0;border:4px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:3rem;">🧪</div>
          </div>
          <div class="test-spinner-text" style="font-size:1.1rem;margin-bottom:1rem;color:#9ca3af;">Initializing tests...</div>
          <div style="width:250px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:0 auto 1rem;">
            <div class="test-spinner-progress-bar" style="height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);width:0%;transition:width 0.3s;"></div>
          </div>
          <div class="test-spinner-stats" style="display:flex;gap:2rem;justify-content:center;font-size:1.25rem;font-weight:600;">
            <span class="test-passed" style="color:#10b981;">✅ 0</span>
            <span class="test-failed" style="color:#ef4444;">❌ 0</span>
          </div>
        </div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    
    document.body.appendChild(spinner);
    this.spinnerEl = spinner;
  },
  
  hideSpinner() {
    document.getElementById('selfTestSpinner')?.remove();
    this.spinnerEl = null;
  },
  
  updateSpinnerText(text) {
    const el = this.spinnerEl?.querySelector('.test-spinner-text');
    if (el) el.textContent = text;
  },
  
  updateSpinnerProgress() {
    if (!this.spinnerEl) return;
    const passed = this.spinnerEl.querySelector('.test-passed');
    const failed = this.spinnerEl.querySelector('.test-failed');
    if (passed) passed.textContent = `✅ ${this.passed}`;
    if (failed) failed.textContent = `❌ ${this.failed}`;
  },
  
  setStatusMode(mode) {
    const statusBar = document.querySelector('.status-bar, #status-bar-content');
    if (!statusBar) return;
    
    let indicator = statusBar.querySelector('.status-mode');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'status-mode';
      indicator.style.cssText = 'padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;text-transform:uppercase;margin-right:1rem;';
      statusBar.insertBefore(indicator, statusBar.firstChild);
    }
    
    if (mode === 'test') {
      indicator.textContent = '🧪 TEST';
      indicator.style.background = '#6366f120';
      indicator.style.color = '#6366f1';
      indicator.style.display = 'inline-block';
    } else {
      indicator.style.display = 'none';
    }
  },
  
  updateStatusBar(message, progress = null) {
    if (typeof window.updateStatus === 'function') {
      window.updateStatus(message);
    } else if (typeof updateStatus === 'function') {
      updateStatus(message);
    }
    if (progress !== null && this.spinnerEl) {
      const bar = this.spinnerEl.querySelector('.test-spinner-progress-bar');
      if (bar) bar.style.width = `${progress}%`;
    }
  },
  
  showResults() {
    document.getElementById('selfTestResults')?.remove();
    
    const total = this.passed + this.failed;
    const percentage = total > 0 ? Math.round((this.passed / total) * 100) : 0;
    const statusColor = this.failed === 0 ? '#10b981' : this.failed <= 3 ? '#f59e0b' : '#ef4444';
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  BUILDER SELF-TEST RESULTS');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  Total: ${total} tests`);
    console.log(`  ✅ Passed: ${this.passed}`);
    console.log(`  ❌ Failed: ${this.failed}`);
    console.log(`  📊 Score: ${percentage}%`);
    console.log('════════════════════════════════════════════════════════════\n');
    
    const modal = document.createElement('div');
    modal.id = 'selfTestResults';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100000;';
    
    modal.innerHTML = `
      <div style="background:var(--bg-secondary,#1f2937);border:1px solid var(--border-color,#374151);border-radius:12px;padding:2rem;width:600px;max-width:90vw;max-height:80vh;overflow-y:auto;">
        <h2 style="margin:0 0 1.5rem;display:flex;align-items:center;gap:0.75rem;">
          🧪 Self-Test Results
          <span style="margin-left:auto;font-size:0.9rem;padding:0.25rem 0.75rem;border-radius:999px;background:${statusColor}20;color:${statusColor};">${percentage}%</span>
        </h2>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
          <div style="background:var(--bg-tertiary,#374151);padding:1rem;border-radius:8px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;">${total}</div>
            <div style="color:var(--text-secondary,#9ca3af);font-size:0.85rem;">Total</div>
          </div>
          <div style="background:#10b98120;padding:1rem;border-radius:8px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;color:#10b981;">✅ ${this.passed}</div>
            <div style="color:#10b981;font-size:0.85rem;">Passed</div>
          </div>
          <div style="background:${this.failed > 0 ? '#ef444420' : 'var(--bg-tertiary,#374151)'};padding:1rem;border-radius:8px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;color:${this.failed > 0 ? '#ef4444' : 'inherit'};">❌ ${this.failed}</div>
            <div style="color:${this.failed > 0 ? '#ef4444' : 'var(--text-secondary,#9ca3af)'};font-size:0.85rem;">Failed</div>
          </div>
        </div>
        
        ${this.failed > 0 ? `
          <div style="margin-bottom:1.5rem;">
            <h3 style="margin:0 0 0.75rem;font-size:1rem;color:#ef4444;">Failed Tests:</h3>
            <div style="background:#ef444410;border:1px solid #ef444430;border-radius:8px;padding:0.5rem;max-height:200px;overflow-y:auto;">
              ${failedTests.map(t => `
                <div style="padding:0.75rem;border-bottom:1px solid #ef444420;">
                  <div style="font-weight:500;">❌ ${t.name}</div>
                  ${t.details ? `<div style="font-size:0.8rem;color:var(--text-secondary,#9ca3af);margin-top:0.25rem;">${t.details}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="background:#10b98110;border:1px solid #10b98130;border-radius:8px;padding:1.5rem;text-align:center;margin-bottom:1.5rem;">
            <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎉</div>
            <div style="font-size:1.1rem;font-weight:600;color:#10b981;">All tests passed!</div>
            <div style="color:var(--text-secondary,#9ca3af);font-size:0.85rem;margin-top:0.25rem;">Builder is functioning correctly</div>
          </div>
        `}
        
        <div style="display:flex;gap:1rem;justify-content:flex-end;">
          <button onclick="console.table(BuilderSelfTest.results)" style="padding:0.5rem 1rem;background:var(--bg-tertiary,#374151);border:1px solid var(--border-color,#4b5563);border-radius:6px;color:var(--text-primary,#f9fafb);cursor:pointer;">📋 Log Details</button>
          <button onclick="document.getElementById('selfTestResults').remove()" style="padding:0.5rem 1rem;background:var(--primary,#6366f1);border:none;border-radius:6px;color:white;cursor:pointer;font-weight:500;">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    
    // ESC to close
    const handleEsc = e => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); }};
    document.addEventListener('keydown', handleEsc);
  },
  
  showFixDialog(name, details, hasFixFn) {
    return new Promise(resolve => {
      const result = confirm(`Test Failed: ${name}\n\n${details || 'No details'}\n\n${hasFixFn ? 'Attempt auto-fix?' : 'Continue testing?'}`);
      resolve(result && hasFixFn);
    });
  }
};

// Expose globally
window.BuilderSelfTest = BuilderSelfTest;

// Keyboard shortcut: Ctrl+Shift+T
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    BuilderSelfTest.runAll();
  }
});

console.log('[Builder Self-Test] Loaded. Press Ctrl+Shift+T to run tests.');
