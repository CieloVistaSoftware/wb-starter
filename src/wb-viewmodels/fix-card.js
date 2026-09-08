import { WBCard } from './x-card.js';
import { mdhtml } from './mdhtml.js';
import { ensureBehaviorCss } from '../core/style-loader.js';

/**
 * Fix Card Component
 * -----------------------------------------------------------------------------
 * Special card for displaying fix details.
 * 
 * Custom Tag: <div x-fix-card>
 * -----------------------------------------------------------------------------
 */
export class WBFixCard extends WBCard {
  constructor() {
    super();
    this.fixData = null;
  }

  set data(fix) {
    this.fixData = fix;
    this.render();
  }

  connectedCallback() {
    super.connectedCallback();
    this.classList.add('fix-card');
    
    // #1014: a 125-line <style> block carrying 49 `!important` declarations
    // used to be injected here. It now lives in src/styles/behaviors/fix-card.css,
    // loaded through the behavior CSS manifest like every other behavior's
    // styles. The !important was compensating for a specificity tie with
    // card.css (both 0-2-0); the stylesheet uses .x-card.fix-card (0-3-0) and
    // wins on merit instead.
    ensureBehaviorCss('fix-card');

    // If data was set before connection, render now
    if (this.fixData) {
      this.render();
    }
  }

  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getLanguage(fix) {
    if (fix.fix && fix.fix.file) {
      if (fix.fix.file.endsWith('.css')) return 'css';
      if (fix.fix.file.endsWith('.html')) return 'html';
      if (fix.fix.file.endsWith('.json')) return 'json';
    }
    return 'js';
  }

  render() {
    if (!this.fixData || !this.card) return;
    const fix = this.fixData;
    
    let statusDisplay = fix.status || 'INCOMPLETE';
    let statusClass = `status-${(statusDisplay).toLowerCase().replace(/\s+/g, '-')}`;

    // Enforce test requirement: No test = Failed (unless Pending)
    if (!fix.testRun && statusDisplay.toUpperCase() !== 'PENDING') {
      statusDisplay = 'TEST MISSING';
      statusClass = 'status-failed'; // Or status-test-missing if preferred, but CSS uses status-failed
    }

    const dateStr = new Date(fix.date).toLocaleDateString();
    
    const hasCause = fix.cause && fix.cause.trim().length > 0;
    const isMissingBehavior = fix.errorSignature && fix.errorSignature.includes('Unknown behavior');
    const redHoverText = isMissingBehavior ? 'title="CRITICAL: This error indicates a missing behavior file or registration issue, which prevents the component from functioning entirely."' : '';
    
    const causeHtml = hasCause 
      ? `<div class="detail-content ${isMissingBehavior ? 'glow-red' : ''}" ${redHoverText}>${this.escapeHtml(fix.cause)}</div>`
      : `<div class="detail-content violation" style="color: var(--danger); border: 1px dashed var(--danger); background: rgba(239, 68, 68, 0.1);">VIOLATION: No cause specified. Fix requirements mandate a known cause.</div>`;

    const errorSignature = (() => {
      const sig = fix.errorSignature;
      if (!sig) return '';   // no signature recorded for this shape of fix — say nothing rather than something wrong
      if (sig.includes('Enhancement')) {
        // Try to find a component doc link - use direct path for simplicity
        // `behavior` is canonical since the components removal -- fix-viewer.html
        // already groups on fix.behavior (line 431). This read still said
        // fix.component, so the two halves of the same page disagreed about
        // what the field is called (#911).
        const compName = (fix.behavior || fix.component || '').split('/').pop().replace('.js', '');
        if (compName) {
          // docs/components/semantics/ does not exist -- the docs live in
          // docs/behaviors/ since the components removal, so every
          // enhancement link in the viewer 404'd (#911).
          return `<a href="/docs/behaviors/${this.escapeHtml(compName)}.md" target="_blank" style="color: var(--primary); text-decoration: none; border-bottom: 1px dashed var(--primary);">Enhancement: See ${this.escapeHtml(compName)}.md</a>`;
        }
        return this.escapeHtml(sig);
      }
      return this.escapeHtml(sig);
    })();

    // Prepare Header Content.
    // Only emit a status id when errorId is present — otherwise multiple cards
    // collapse to a duplicate id="status-undefined" (compliance: unique IDs).
    const errorIdSafe = (fix.errorId != null && String(fix.errorId).length > 0)
      ? this.escapeHtml(String(fix.errorId))
      : '';
    const headerContent = `
      <div class="card-header" style="border:none;padding:0;margin:0;">
        <div class="header-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <div class="fix-id" style="font-family:monospace;color:var(--text-secondary);background:rgba(0,0,0,0.3);padding:0.2rem 0.4rem;border-radius:4px;">${errorIdSafe || '—'}</div>
          <span ${errorIdSafe ? `id="status-${errorIdSafe}"` : ''} class="fix-status ${statusClass}" style="padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;font-weight:bold;text-transform:uppercase;">${this.escapeHtml(statusDisplay)}</span>
        </div>
        <h3 class="fix-title" style="margin:0;font-size:1.1rem;color:var(--text-primary);">${this.escapeHtml(fix.title || (fix.issue ? `#${fix.issue}` : 'Untitled fix'))}</h3>
      </div>
    `;

    // Prepare Main Content
    const mainContent = `
      <div class="fix-meta" style="display:flex;gap:1rem;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border-color);">
        <div class="meta-item" style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem;color:var(--text-secondary);">
          <span>📦</span> ${this.escapeHtml(fix.component || 'Global')}
        </div>
        <div class="meta-item" style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem;color:var(--text-secondary);">
          <span>📅</span> ${dateStr}
        </div>
      </div>

      <div class="fix-details" style="display:flex;flex-direction:column;gap:1rem;">
        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Error Signature</span>
          <div class="signature-block">${errorSignature}</div>
        </div>

        ${fix.stackTrace ? `
          <div class="detail-row">
            <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Stack Trace</span>
            <div class="stack-trace">${this.escapeHtml(fix.stackTrace)}</div>
          </div>
        ` : ''}

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Cause</span>
          ${causeHtml}
        </div>

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Action Taken</span>
          <div class="detail-content">${this.escapeHtml(fix.fix && fix.fix.action ? fix.fix.action : 'No action specified')}</div>
        </div>

        ${fix.fix && fix.fix.code ? `
          <div class="detail-row">
            <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:1rem;">Code Change</span>
            <div class="detail-content">
              <div class="fix-code-block">${this.escapeHtml("```" + this.getLanguage(fix) + "\n" + fix.fix.code + "\n```")}</div>
            </div>
          </div>
        ` : ''}

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">File</span>
          ${fix.fix && fix.fix.file ? `
            <code style="background:rgba(0,0,0,0.2);padding:0.2rem 0.4rem;border-radius:3px;display:block;max-height:100px;overflow-y:auto;">${this.escapeHtml(fix.fix.file)}</code>
          ` : '<span style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">None specified</span>'}
        </div>

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Test Status</span>
          <div class="detail-content" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--text-muted); font-size: 0.8rem;">Test Run:</span>
              <span class="${fix.testRun ? 'status-fixed' : 'status-pending'}" style="font-family: monospace; font-size: 0.8rem; color:${fix.testRun ? 'var(--success)' : 'var(--warning)'};">${fix.testRun === true ? 'TRUE' : 'FALSE'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--text-muted); font-size: 0.8rem; flex-shrink: 0;">Test Name:</span>
              ${fix.testName ? `<code style="background:rgba(0,0,0,0.2);padding:0.2rem 0.4rem;border-radius:3px;display:block;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;flex:1;min-width:0;">${this.escapeHtml(fix.testName)}</code>` : '<span style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">None specified</span>'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Use the base card to build the structure
    // We pass showHeader: true explicitly, and provide content
    const { main } = this.card.buildStructure({
      headerContent: headerContent,
      mainContent: mainContent,
      showHeader: true,
      showMain: true,
      showFooter: false // No footer for now
    });

    // Initialize mdhtml on code blocks
    const codeBlocks = this.querySelectorAll('.fix-code-block');
    codeBlocks.forEach(block => mdhtml(block));

    // Let CSS handle max-height constraints (750px in injected styles)
    // this.style.maxHeight is NOT overridden here to respect the CSS limit

    // Ensure the main content area expands
    if (main) {
      main.style.overflowY = 'visible';
      main.style.flex = '1 1 auto';
      
      // Also ensure internal code blocks don't take up too much space individually
      // (Though the global card scroll handles the overflow, keeping these small helps UX)
      const internalBlocks = main.querySelectorAll('code, .stack-trace, .signature-block');
      internalBlocks.forEach(block => {
        // Only apply scroll container class to non-fix-code blocks (stack trace etc)
        if (!block.closest('.fix-code-block')) {
            block.classList.add('x-fix-card-scroll-container');
            block.style.maxHeight = '100px';
            block.style.overflowY = 'auto';
            block.style.display = 'block';
        }
      });
    }
  }
}

// Component tags are gone, so this element is no longer defined.
// The class stays: other exports in this file are still imported.

// #365: exported so wb-viewmodels/index.js's lazy-loader can resolve a
// 'fix-card' behavior for this module (getBehavior() falls back to
// module.default when no named export matches). The real work happens in
// WBFixCard's own connectedCallback/`data` setter above via the native
// custom-element upgrade that importing this module triggers -- this
// function is only the compliance-signaling touch, so schema/tag-map dispatch
// has something to call without fighting the class for DOM ownership.
//
// This used to cite x-control.js's `control()` as another instance of the same
// "self-registering custom element" pattern. It never was one: nothing
// registered WBControl, so its connectedCallback never ran, and the class is
// deleted (#1063). x-fix-card is now the ONLY registered custom element in
// src/ -- WBCard (x-card.js) is live solely as the base class WBFixCard
// extends. Converting fix-card to a plain behavior is tracked in #660 / #789.
export default function fixCard(element) {
  element.classList.add('x-fix-card');
  return () => {};
}

// Registration shim (#911).
//
// f624fcc9 (4.0.0 — components removed) deleted
//   customElements.define('wb-fix-card', WBFixCard);
// and without this the Custom Elements API leaves every <x-fix-card> inert:
// connectedCallback never fires, .fix-card is never applied, and the matching
// stylesheet has nothing to style.
//
// #1061 — WHAT CHANGED, AND WHAT DID NOT.
//
// This comment used to justify itself with "public/fix-viewer.html still does
// createElement('x-fix-card') and assigns card.data". It does not any more:
// that page now renders a table on both of its render paths, because John
// asked to track a fix back to its issue and forward to its release, which a
// card grid could not show. `grep -c "x-fix-card" public/fix-viewer.html` is 0.
//
// That makes the page a former CONSUMER, not the reason this exists. The
// behavior itself is fully registered and reachable by anyone writing
// <div x-fix-card>: tag-map.js:212, wb-viewmodels/index.js:95,
// behavior-css-manifest.js:87, wb-lazy.js:378's eager selector list,
// schema-builder.js:973, and its own src/wb-models/fix-card.schema.json with
// documented examples. Removing it would delete a working behavior from the
// framework, which is a different and much larger decision than dropping the
// dead code it superficially resembles.
//
// So the shim stays and the claim about fix-viewer.html is corrected. Whether
// the framework should keep a fix-card behavior at all is a product question,
// left on #1061 rather than answered by whoever happened to change the page.
//
// TIER1-LAWS §2 permits this shape: a registration shim the Custom Elements API
// requires, holding no shared behavior logic. Converting fix-card to a behavior
// is the right end state and is tracked in #660 / #789.
if (typeof customElements !== 'undefined' && !customElements.get('x-fix-card')) {
  customElements.define('x-fix-card', WBFixCard);
}
